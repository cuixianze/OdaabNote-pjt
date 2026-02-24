# PDF → Gemini 추출 후 DB 입력용 형식

Gemini Pro로 PDF에서 추출한 내용을 **한 문제당 아래 JSON 하나**로 주시면, 이걸 기준으로 DB에 넣는 스크립트/SQL을 만들어 드릴 수 있습니다.

---

## 1. 문제 1개당 JSON 형식 (권장)

```json
{
  "questionText": "다음 중 TCP의 특성으로 옳은 것은?",
  "choices": [
    { "key": "A", "text": "비연결형 서비스이다." },
    { "key": "B", "text": "연결형 서비스이며 신뢰성 있는 전송을 한다." },
    { "key": "C", "text": "실시간 스트리밍에 적합하다." },
    { "key": "D", "text": "헤더 크기가 8바이트이다." }
  ],
  "correctChoiceKey": "B",
  "explanation": "통합 해설(선택). 비워두면 choiceExplanations만 사용해도 됨.",
  "choiceExplanations": [
    { "choice": "1", "explanation": "1번 선지 해설 (왜 틀렸는지/맞는지)" },
    { "choice": "2", "explanation": "2번 선지 해설" },
    { "choice": "3", "explanation": "3번 선지 해설" },
    { "choice": "4", "explanation": "4번 선지 해설" }
  ],
  "coreConcept": "TCP: 연결지향, 신뢰성, 순서보장 (첫 줄 요약용)",
  "keyConcepts": [
    "TCP: 연결지향, 신뢰성, 순서보장, 3-way handshake",
    "UDP: 비연결, 빠름, 오버헤드 적음"
  ],
  "subjectName": "데이터 통신론",
  "unitName": "Chapter 01 데이터 통신 기초",
  "tagNames": ["기출", "초빈출"],
  "source": "9급 국가직 컴퓨터일반 2025.04.05",
  "difficulty": 1
}
```

---

## 2. 필드 설명

| 필드 | 필수 | 설명 |
|------|------|------|
| **questionText** | ✅ | 문제 지문 전체 |
| **choices** | ✅ | 선지 배열. **key**는 `"A"`~`"D"`, **text**는 선지 내용 |
| **correctChoiceKey** | ✅ | 정답. `"A"` / `"B"` / `"C"` / `"D"` 중 하나 |
| **explanation** | | 통합 해설(한 덩어리). 비워두거나 생략 가능 |
| **choiceExplanations** | | 선지별 해설. **choice**: `"1"`~`"4"` (1번~4번 선지), **explanation**: 해설 문장 |
| **coreConcept** | | 핵심 개념 한 줄 요약 (화면에 한 줄로 쓸 때 사용) |
| **keyConcepts** | | 키워드 반사신경. `"개념명: 키워드1, 키워드2, ..."` 문자열 배열 |
| **subjectName** | | 과목명 (예: 운영체제론, 데이터 통신론). DB에 있는 이름과 동일하게 |
| **unitName** | | 단원명 (예: Chapter 01 ~). DB에 있는 이름과 동일하게 |
| **tagNames** | | 태그 이름 배열 (예: 기출, 초빈출). DB에 있는 이름만 |
| **source** | | 출처 (예: 시험명·날짜) |
| **difficulty** | | 난이도 숫자 (1~5 등). 선택 |

- **subjectName / unitName**: DB에 이미 있는 과목·단원 이름이면 그대로 쓰면 됩니다. 없으면 넣을 때 과목/단원 없이 넣거나, 먼저 시드로 넣어 두어야 합니다.
- **tagNames**: DB에 등록된 태그 이름만 사용합니다 (초빈출, 별표100개, 지엽적, 기출, 통암기 + 유저 이름 등).

---

## 3. 여러 문제를 줄 때

- **방법 A**: 문제마다 JSON 객체 하나씩 붙여서 보내기  
  `{ ... }, { ... }, { ... }`
- **방법 B**: JSON 배열 하나로 보내기  
  `[ { ... }, { ... } ]`

둘 다 처리 가능한 스크립트를 만들 수 있습니다.

---

## 4. 일괄 등록 API (사용 방법)

- **엔드포인트**: `POST /api/problems/import`
- **Body 예시**:
```json
{
  "ownerUserId": 1,
  "problems": [
    { "questionText": "...", "choices": [...], "correctChoiceKey": "D", "choiceExplanations": [...], "keyConcepts": [...], "subjectName": "데이터통신론", "unitName": "6장. 최신 네트워크 신기술 및 보안", "tagNames": ["기출"], "source": "9급 국가직 2025.04.05" },
    ...
  ]
}
```
- **ownerUserId**는 생략 가능(기본 1).
- **과목/단원 이름**: DB 시드와 다르게 적어도 서비스에서 자동 매핑합니다.
  - 예: `데이터통신론` → `데이터 통신론`, `전자계산기구조론` → `전자계산기 구조론`
  - 단원: `6장. 최신 네트워크 신기술 및 보안` → `네트워크 보안 및 신기술`, `3장. 중앙처리장치(CPU) 구조와 기능` → `중앙처리장치(CPU)` 등
- **tagNames**: DB에 있는 태그 이름만 연결됩니다. 없는 이름(예: `단순암기`)은 무시됩니다. 필요하면 `POST /api/tags`로 태그를 먼저 등록하세요.

**curl 예시 (배포 서버)**:
```bash
curl -X POST http://43.200.170.32/api/problems/import \
  -H "Content-Type: application/json" \
  -d @scripts/import-4problems.json
```
예시 JSON: `scripts/import-4problems.json` (4문항).
