# Universal Multi-Language Translator Tool Instructions

## Overview
The **Translator Tool** (`translate`) is an open, generic translation and localization service for Styx Agent OS. It is designed to serve operators and users globally across **50+ languages**, formal & colloquial communication styles, and customized regional dialects:

1. **Global Languages**: English, Spanish, French, German, Chinese (Simplified/Traditional), Japanese, Korean, Arabic, Russian, Portuguese, Italian, Dutch, Hindi, Bengali, etc.
2. **Colloquial & Transliterated Dialects**:
   - `gujlish`: Conversational Gujarati written phonetically in the Latin/English alphabet (common for WhatsApp & SMS).
   - `hinglish`: Conversational Hindi written phonetically in the Latin alphabet.
   - `romaji` / `pinyin`: Romanized Japanese and Chinese.
3. **Regional Native Scripts**: Native Gujarati script (ગુજરાતી), Devanagari Hindi (हिन्दी), Kanji/Kana (日本語), Arabic script (العربية), etc.

---

## Golden Directive: Always Use English — Leave Translation to the Translator Tool

> [!IMPORTANT]
> **CRITICAL AGENT OPERATING DIRECTIVE:**
> 1. **ALWAYS REASON, DRAFT, AND PROPOSE OPTIONS IN ENGLISH**:
>    - You must ALWAYS write your internal `<think>` reasoning, conversation responses to your operator, and proposed `<options>` in standard English.
>    - NEVER attempt to compose non-English text, foreign languages, or regional colloquial dialects (such as Gujlish, Hinglish, Spanish, French, Gujarati, etc.) yourself in thought, prose, or options!
> 2. **NO MANUAL FOREIGN LANGUAGE OR DIALECT GENERATION**:
>    - Generating non-English dialects directly in your thought process or options produces broken, unnatural, or hallucinated sentences (e.g. broken Gujlish).
> 3. **DELEGATE ALL TRANSLATION TO THE `translate` TOOL**:
>    - Formulate your draft messages, suggested replies, and options in clean English:
>      - CORRECT: `<option>Translate and send: "Sure, come quickly! 😄"</option>`
>      - STRICTLY FORBIDDEN: `<option>Translate and send: "Ji, jaldi aa ja! 😄"</option>` (NEVER draft foreign words inside options!)
>    - When a message needs to be sent or shown in a specific target language or dialect, invoke the `translate` tool (`target_lang: "..."`).
>    - Leave all translation, transliteration, and localization entirely to the translator tool.
> 4. **MANDATORY OUTBOUND SENDING PROTOCOL (`send_message`, `send_email`)**:
>    - When sending an outbound message to a contact in their language or dialect:
>      1. Call `translate(text: "<english_draft>", target_lang: "<contact_language>")`.
>      2. In the subsequent `send_message` (or `send_email`) tool call, the `message` argument MUST BE the exact `translated` string returned by the `translate` tool!
>      3. **STRICTLY FORBIDDEN**: NEVER pass your English draft into `send_message`. The external contact expects the message in their language; sending English defeats translation!
>      4. In your summary response to your operator in Styx chat, report the translation clearly:
>         - English draft: "..."
>         - Translated message sent: "<exact translated string from tool>"

---

## When to Call `translate`

1. **Cross-Language Inbound Messages**:
   - When receiving messages or documents from users or contacts in another language, call `translate` with `target_lang: "english"` (or your preferred working language).
2. **Context-Appropriate Outbound Responses**:
   - When responding to contacts on messaging platforms (WhatsApp, Email, etc.), formulate your reply in clean English, then translate to the contact's preferred language and dialect (e.g., `target_lang: "spanish"`, `target_lang: "gujlish"`, `target_lang: "french"`).
3. **Tone Matching**:
   - Use `tone: "casual"` for messaging platforms and chats.
   - Use `tone: "formal"` or `tone: "business"` for client emails, official correspondence, and professional documentation.
   - Use `tone: "slang"` for modern youth expressions.
4. **Mandatory Execution on Colloquial Dialects & Slang**:
   - Always call `translate` whenever encountering non-English phrases, regional slang, or romanized dialects (e.g. Gujlish, Hinglish). Never guess or hallucinate translations in your thought trace; rely completely on the translator tool.

---

## Tool Signature

```json
{
  "name": "translate",
  "arguments": {
    "text": "Hello, thank you for reaching out. How can I assist you today?",
    "target_lang": "spanish",
    "source_lang": "auto",
    "tone": "formal"
  }
}
```

### Parameters
- **`text`** *(string, required)*: The text string to translate.
- **`target_lang`** *(string, required)*: Target language code or name (e.g., `"spanish"`, `"french"`, `"german"`, `"gujlish"`, `"gujarati"`, `"hindi"`, `"japanese"`, `"chinese"`, `"arabic"`, etc.).
- **`source_lang`** *(string, optional, default: `"auto"`)*: Source language or `"auto"` for automatic detection.
- **`tone`** *(string, optional, default: `"natural"`)*:
  - `"natural"`: Standard conversational translation.
  - `"casual"`: Friendly, informal chat style.
  - `"formal"`: Respectful and polite grammar.
  - `"business"`: Professional enterprise terminology.
  - `"slang"`: Colloquial slang.
- **`glossary`** *(object, optional)*: Key-value terms to preserve or enforce verbatim (e.g., `{"Styx": "Styx", "Agent OS": "Agent OS"}`).
- **`context`** *(object or string, optional)*: Sociolinguistic and cultural context. Unlike English, foreign languages change grammar, pronouns, and verb conjugations based on honorifics and gender:
  - `formality` *(string)*: `"respectful"` / `"formal"` / `"honorific"` (use `tame` in Gujarati, `aap` in Hindi, `vous` in French, `Usted` in Spanish, `Sie` in German) vs `"casual"` / `"informal"` / `"peer"` (use `tu` / `tum` / `du`).
  - `recipient_gender` *(string)*: `"female"` or `"male"` (governs 2nd-person gendered verbs and adjectives).
  - `speaker_gender` *(string)*: `"female"` or `"male"` (governs 1st-person verb conjugations).
  - `relationship` *(string)*: Social dynamic, e.g. `"elder sister"`, `"mother"`, `"boss"`, `"client"`, `"close friend"`, `"younger brother"`.
  - `age_group` *(string)*: `"elder"`, `"peer"`, `"junior"`, `"child"`.
  - `additional_notes` *(string)*: Any situational nuance.

---

## Examples

### 1. English to Gujlish (Respectful Elder vs Casual Friend)
- **Input (Elder Uncle)**:
  `text: "Are you coming today?", target_lang: "gujlish", context: { formality: "respectful", relationship: "elder uncle", recipient_gender: "male" }`
  ➔ **Output**: `"Tame aaje aavsho?"`
- **Input (Casual Peer Friend)**:
  `text: "Are you coming today?", target_lang: "gujlish", context: { formality: "casual", relationship: "friend", recipient_gender: "female" }`
  ➔ **Output**: `"Tu aaje aavish?"`

### 2. English to Hinglish (Gender Agreement)
- **Input (Female Speaker to Male Colleague)**:
  `text: "I am working on it now, will let you know.", target_lang: "hinglish", context: { speaker_gender: "female", recipient_gender: "male", formality: "peer" }`
  ➔ **Output**: `"Main abhi ispar kaam kar rahi hoon, aapko bataoongi."`

### 3. English to Spanish (Formal Business vs Informal)
- **Input**: `text: "We appreciate your partnership. The contract is attached.", target_lang: "spanish", tone: "business", context: { formality: "formal" }`
- **Output**: `"Agradecemos su colaboración. El contrato se encuentra adjunto."`
