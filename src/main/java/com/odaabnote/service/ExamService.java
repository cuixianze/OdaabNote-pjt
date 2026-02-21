package com.odaabnote.service;

import com.odaabnote.domain.Exam;
import com.odaabnote.domain.ExamProblem;
import com.odaabnote.domain.ExamType;
import com.odaabnote.domain.Problem;
import com.odaabnote.domain.Subject;
import com.odaabnote.domain.Unit;
import com.odaabnote.domain.User;
import com.odaabnote.dto.exam.CreateFullExamRequest;
import com.odaabnote.dto.exam.CreateRandomExamRequest;
import com.odaabnote.dto.exam.CreateSubjectExamRequest;
import com.odaabnote.dto.exam.ExamResponse;
import com.odaabnote.repository.ExamProblemRepository;
import com.odaabnote.repository.ExamRepository;
import com.odaabnote.repository.ProblemRepository;
import com.odaabnote.repository.SubjectRepository;
import com.odaabnote.repository.UnitRepository;
import com.odaabnote.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamProblemRepository examProblemRepository;
    private final ProblemRepository problemRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;

    private static final int SUBJECT_EXAM_MAX = 20;
    private static final int FULL_EXAM_COUNT = 20;
    private static final int MIN_PER_UNIT = 2;
    private static final int MAX_PER_UNIT = 3;

    @Transactional
    public ExamResponse createRandomExam(CreateRandomExamRequest request) {
        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + request.subjectId()));

        User creator = request.createdByUserId() != null
                ? userRepository.findById(request.createdByUserId()).orElse(null)
                : null;

        List<Problem> randomProblems = problemRepository.findRandomBySubjectId(
                subject.getId(),
                PageRequest.of(0, request.count())
        );

        if (randomProblems.size() < request.count()) {
            throw new IllegalStateException("Not enough problems for subject: " + subject.getId());
        }

        String title = subject.getName() + " 랜덤 " + request.count() + "제";

        Exam exam = new Exam(
                title,
                ExamType.RANDOM,
                subject,
                null,
                creator,
                request.count()
        );

        Exam savedExam = examRepository.save(exam);

        int questionNo = 1;
        for (Problem problem : randomProblems) {
            ExamProblem examProblem = new ExamProblem(savedExam, problem, questionNo++);
            examProblemRepository.save(examProblem);
        }

        List<ExamProblem> examProblems = examProblemRepository.findByExamIdOrderByQuestionNoAsc(savedExam.getId());
        return ExamResponse.from(savedExam, examProblems);
    }

    /** 과목별 모의고사: 단원당 2~3문항, 최대 20제 */
    @Transactional
    public ExamResponse createSubjectExam(CreateSubjectExamRequest request) {
        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + request.subjectId()));
        User creator = request.createdByUserId() != null
                ? userRepository.findById(request.createdByUserId()).orElse(null)
                : null;

        List<Unit> units = unitRepository.findBySubject_IdOrderByUnitOrderAsc(subject.getId());
        if (units.isEmpty()) {
            throw new IllegalStateException("No units for subject: " + subject.getId());
        }

        int totalNeeded = Math.min(SUBJECT_EXAM_MAX, 20);
        int unitCount = units.size();
        int basePerUnit = MIN_PER_UNIT;
        int remainder = totalNeeded - basePerUnit * unitCount;
        if (remainder < 0) {
            remainder = 0;
            unitCount = (totalNeeded + basePerUnit - 1) / basePerUnit;
            units = units.subList(0, Math.min(unitCount, units.size()));
            unitCount = units.size();
        }

        List<Problem> selected = new ArrayList<>();
        for (int i = 0; i < units.size(); i++) {
            int take = basePerUnit + (i < remainder ? 1 : 0);
            take = Math.min(take, MAX_PER_UNIT);
            List<Problem> byUnit = problemRepository.findRandomByUnitId(
                    units.get(i).getId(),
                    PageRequest.of(0, take)
            );
            selected.addAll(byUnit);
        }
        Collections.shuffle(selected);
        if (selected.size() > totalNeeded) {
            selected = selected.subList(0, totalNeeded);
        }
        if (selected.size() < totalNeeded && selected.size() < 5) {
            throw new IllegalStateException("Not enough problems for subject exam. Need at least " + totalNeeded + ", got " + selected.size());
        }

        Exam exam = new Exam(
                subject.getName() + " 과목별 모의고사 " + selected.size() + "제",
                ExamType.SUBJECT,
                subject,
                null,
                creator,
                selected.size()
        );
        Exam savedExam = examRepository.save(exam);
        int qno = 1;
        for (Problem p : selected) {
            examProblemRepository.save(new ExamProblem(savedExam, p, qno++));
        }
        List<ExamProblem> examProblems = examProblemRepository.findByExamIdOrderByQuestionNoAsc(savedExam.getId());
        return ExamResponse.from(savedExam, examProblems);
    }

    /** 전체 모의고사: 과목당 2~3문항, 20제 고정 */
    @Transactional
    public ExamResponse createFullExam(CreateFullExamRequest request) {
        User creator = request.createdByUserId() != null
                ? userRepository.findById(request.createdByUserId()).orElse(null)
                : null;

        List<Subject> subjects = subjectRepository.findAll();
        if (subjects.size() < 2) {
            throw new IllegalStateException("Need at least 2 subjects for full exam");
        }

        int totalNeeded = FULL_EXAM_COUNT;
        int subjectCount = subjects.size();
        int basePerSubject = totalNeeded / subjectCount;
        int remainder = totalNeeded - basePerSubject * subjectCount;

        List<Problem> selected = new ArrayList<>();
        for (int i = 0; i < subjects.size(); i++) {
            int take = basePerSubject + (i < remainder ? 1 : 0);
            take = Math.min(Math.max(take, MIN_PER_UNIT), MAX_PER_UNIT);
            List<Problem> bySubject = problemRepository.findRandomBySubjectId(
                    subjects.get(i).getId(),
                    PageRequest.of(0, take)
            );
            selected.addAll(bySubject);
        }
        Collections.shuffle(selected);
        if (selected.size() > totalNeeded) {
            selected = selected.subList(0, totalNeeded);
        }
        if (selected.size() < 10) {
            throw new IllegalStateException("Not enough problems for full exam. Got " + selected.size());
        }

        Exam exam = new Exam(
                "전체 모의고사 " + selected.size() + "제",
                ExamType.FULL,
                null,
                null,
                creator,
                selected.size()
        );
        Exam savedExam = examRepository.save(exam);
        int qno = 1;
        for (Problem p : selected) {
            examProblemRepository.save(new ExamProblem(savedExam, p, qno++));
        }
        List<ExamProblem> examProblems = examProblemRepository.findByExamIdOrderByQuestionNoAsc(savedExam.getId());
        return ExamResponse.from(savedExam, examProblems);
    }

    public ExamResponse getExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));
        List<ExamProblem> examProblems = examProblemRepository.findByExamIdOrderByQuestionNoAsc(examId);
        return ExamResponse.from(exam, examProblems);
        }
}

