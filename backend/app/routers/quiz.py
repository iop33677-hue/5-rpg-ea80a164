from datetime import datetime
import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import QuizSession, QuizQuestion, QuizParticipant, QuizResponse, QuestionBankItem, Student
from app.schemas import (
    QuizSessionCreate, QuizSessionRead, QuizParticipantRead, 
    QuizQuestionRead, QuizResponseSubmit, QuizResponseRead, QuizSessionDetailRead
)

router = APIRouter(prefix="/quiz", tags=["quiz"])

def generate_pin_code() -> str:
    return "".join(random.choices(string.digits, k=6))

@router.post("/sessions", response_model=QuizSessionRead)
def create_quiz_session(quiz: QuizSessionCreate, db: Session = Depends(get_db)):
    # Verify all question_ids exist
    questions = db.query(QuestionBankItem).filter(QuestionBankItem.id.in_(quiz.question_ids)).all()
    if len(questions) != len(quiz.question_ids):
        raise HTTPException(status_code=400, detail="Some questions were not found.")

    # Create session
    pin_code = generate_pin_code()
    # Ensure pin is unique
    while db.query(QuizSession).filter(QuizSession.pin_code == pin_code).first():
        pin_code = generate_pin_code()

    session = QuizSession(
        pin_code=pin_code,
        title=quiz.title,
        status="lobby",
        current_question_index=0,
        is_question_open=False
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Add questions
    for idx, q_id in enumerate(quiz.question_ids):
        qq = QuizQuestion(
            quiz_session_id=session.id,
            question_item_id=q_id,
            order_index=idx,
            time_limit=quiz.time_limit
        )
        db.add(qq)
    
    db.commit()
    return session

@router.get("/sessions/current", response_model=QuizSessionDetailRead)
def get_current_quiz_session(db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.status.in_(["lobby", "playing"])).order_by(QuizSession.created_at.desc()).first()
    if not session:
        raise HTTPException(status_code=404, detail="No active quiz session found.")
    
    participants = db.query(QuizParticipant).filter(QuizParticipant.quiz_session_id == session.id).all()
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_session_id == session.id).order_by(QuizQuestion.order_index).all()
    
    participant_reads = []
    for p in participants:
        participant_reads.append(QuizParticipantRead(
            id=p.id,
            quiz_session_id=p.quiz_session_id,
            student_id=p.student_id,
            student_number=p.student.student_number,
            student_name=p.student.name,
            joined_at=p.joined_at
        ))
        
    question_reads = []
    for q in questions:
        question_reads.append(QuizQuestionRead(
            id=q.id,
            quiz_session_id=q.quiz_session_id,
            question_item_id=q.question_item_id,
            order_index=q.order_index,
            time_limit=q.time_limit,
            prompt=q.bank_item.prompt,
            subject=q.bank_item.subject,
            answer=q.bank_item.answer
        ))
        
    return QuizSessionDetailRead(
        session=session,
        participants=participant_reads,
        questions=question_reads
    )

@router.post("/sessions/{pin_code}/join", response_model=QuizParticipantRead)
def join_quiz(pin_code: str, access_code: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.pin_code == pin_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found.")
    if session.status != "lobby":
        raise HTTPException(status_code=400, detail="Quiz is already in progress or finished.")
        
    student = db.query(Student).filter(Student.access_code == access_code).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    participant = db.query(QuizParticipant).filter(
        QuizParticipant.quiz_session_id == session.id,
        QuizParticipant.student_id == student.id
    ).first()
    
    if not participant:
        participant = QuizParticipant(
            quiz_session_id=session.id,
            student_id=student.id
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        
    return QuizParticipantRead(
        id=participant.id,
        quiz_session_id=participant.quiz_session_id,
        student_id=participant.student_id,
        student_number=student.student_number,
        student_name=student.name,
        joined_at=participant.joined_at
    )

@router.post("/sessions/{session_id}/state", response_model=QuizSessionRead)
def update_quiz_state(session_id: int, status: str, current_question_index: int, is_question_open: bool, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    session.status = status
    session.current_question_index = current_question_index
    session.is_question_open = is_question_open
    db.commit()
    db.refresh(session)
    return session

@router.post("/questions/{question_id}/submit", response_model=QuizResponseRead)
def submit_response(question_id: int, access_code: str, response: QuizResponseSubmit, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.access_code == access_code).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    qq = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not qq:
        raise HTTPException(status_code=404, detail="Question not found.")
        
    session = qq.quiz_session
    if not session.is_question_open or session.current_question_index != qq.order_index:
        raise HTTPException(status_code=400, detail="Question is not open for submission.")
        
    existing = db.query(QuizResponse).filter(
        QuizResponse.quiz_question_id == qq.id,
        QuizResponse.student_id == student.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted.")
        
    is_correct = (response.submitted_answer.strip().lower() == qq.bank_item.answer.strip().lower())
    
    # Calculate score: max 1000 points. 
    # Base 500 for correct + up to 500 based on time.
    score = 0
    if is_correct:
        time_ratio = 1.0 - min(1.0, response.response_time_ms / (qq.time_limit * 1000))
        score = 500 + int(500 * time_ratio)
        
    quiz_resp = QuizResponse(
        quiz_session_id=session.id,
        quiz_question_id=qq.id,
        student_id=student.id,
        submitted_answer=response.submitted_answer,
        is_correct=is_correct,
        response_time_ms=response.response_time_ms,
        score_earned=score
    )
    db.add(quiz_resp)
    db.commit()
    db.refresh(quiz_resp)
    return quiz_resp

@router.get("/sessions/{session_id}/leaderboard")
def get_leaderboard(session_id: int, db: Session = Depends(get_db)):
    responses = db.query(QuizResponse).filter(QuizResponse.quiz_session_id == session_id).all()
    
    scores = {}
    for r in responses:
        if r.student_id not in scores:
            scores[r.student_id] = {"student_name": r.student.name, "score": 0, "correct_count": 0}
        scores[r.student_id]["score"] += r.score_earned
        if r.is_correct:
            scores[r.student_id]["correct_count"] += 1
            
    leaderboard = sorted([{"student_id": k, **v} for k, v in scores.items()], key=lambda x: x["score"], reverse=True)
    return {"leaderboard": leaderboard}
