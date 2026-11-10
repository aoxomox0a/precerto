import React, { useMemo, useState } from 'react'
import { Button } from './Buttons'
import './FormStepper.css'

const buildCategories = (questions) => {
  const categories = {}
  questions.forEach((question) => {
    categories[question.category] = categories[question.category] || []
    categories[question.category].push(question)
  })
  return Object.entries(categories).map(([category, items]) => ({ category, items }))
}

const renderQuestionField = (question, value, onChange) => {
  const optionStyle = question.presentation === 'chips' ? 'field-option chip-option' : 'field-option'

  switch (question.type) {
    case 'info':
      return <p className="supportive-note">{question.note}</p>
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder={question.placeholder || 'Write your response here'}
        />
      )
    case 'radio':
    case 'segmented':
      return (
        <div className={question.type === 'segmented' ? 'segmented-field' : 'field-group'}>
          {question.options?.map((option) => (
            <label key={option} className={`${optionStyle} ${value === option ? 'selected' : ''}`}>
              <input
                type="radio"
                name={question.id}
                checked={value === option}
                onChange={() => onChange(question.id, option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    case 'toggle':
      return (
        <div className="segmented-field">
          {['No', 'Yes'].map((option) => (
            <label key={option} className={`field-option ${value === option ? 'selected' : ''}`}>
              <input
                type="radio"
                name={question.id}
                checked={value === option}
                onChange={() => onChange(question.id, option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    case 'select':
      return (
        <select value={value || ''} onChange={(e) => onChange(question.id, e.target.value)}>
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    case 'checkbox':
    case 'chips':
      return (
        <div className={question.type === 'chips' ? 'chips-field' : 'field-group'}>
          {question.options?.map((option) => {
            const selectedValues = Array.isArray(value) ? value : []
            return (
              <label
                key={option}
                className={`${optionStyle} ${selectedValues.includes(option) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const nextValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((item) => item !== option)
                    onChange(question.id, nextValues)
                  }}
                />
                <span>{option}</span>
              </label>
            )
          })}
        </div>
      )
    case 'scale': {
      const min = question.scale?.min ?? 0
      const max = question.scale?.max ?? 10
      const currentValue = value ?? min
      return (
        <div className="scale-field">
          <div className="scale-labels">
            <span>{question.scale?.minLabel || min}</span>
            <strong>{currentValue}</strong>
            <span>{question.scale?.maxLabel || max}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={currentValue}
            onChange={(e) => onChange(question.id, Number(e.target.value))}
          />
        </div>
      )
    }
    case 'number':
      return (
        <input
          type="number"
          min={question.min}
          max={question.max}
          value={value || ''}
          onChange={(e) => onChange(question.id, Number(e.target.value))}
          placeholder={question.placeholder || 'Enter a number'}
        />
      )
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder={question.placeholder || 'Write your response'}
        />
      )
  }
}

export const FormStepper = ({
  form,
  initialResponses,
  onComplete,
  onProgress,
  onFinishLater,
}) => {
  // Defensive: if a form has no questions, render a friendly empty state
  if (!form || !Array.isArray(form.questions) || form.questions.length === 0) {
    return (
      <div className="form-stepper empty-form">
        <div className="empty-state">
          <h3>This form is not available</h3>
          <p>There are no questions configured for this form. Please contact your care team.</p>
        </div>
      </div>
    )
  }
  const categories = useMemo(() => buildCategories(form.questions), [form.questions])
  const hasWelcome = Boolean(form.welcome)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const prior = initialResponses || {}
    if (Object.keys(prior).length === 0) return hasWelcome ? -1 : 0
    const firstUnanswered = form.questions.findIndex((q) => {
      const val = prior[q.id]
      if (Array.isArray(val)) return val.length === 0
      return val === undefined || val === null || val === ''
    })
    return firstUnanswered === -1 ? form.questions.length - 1 : firstUnanswered
  })
  const [responses, setResponses] = useState(initialResponses || {})

  const currentQuestion = form.questions[currentIndex]
  const progress = currentIndex < 0 ? 0 : Math.round(((currentIndex + 1) / form.questions.length) * 100)

  const handleChange = (questionId, value) => {
    setResponses((prev) => {
      const nextResponses = { ...prev, [questionId]: value }
      const answeredCount = Object.values(nextResponses).filter((item) => {
        if (Array.isArray(item)) return item.length > 0
        return item !== '' && item !== undefined && item !== null
      }).length
      const responseProgress = Math.round((answeredCount / form.questions.length) * 100)
      onProgress?.(nextResponses, Math.min(responseProgress, 99))
      return nextResponses
    })
  }

  const handleNext = () => {
    if (currentIndex < 0) {
      setCurrentIndex(0)
      return
    }

    if (currentIndex < form.questions.length - 1) {
      setCurrentIndex((value) => value + 1)
      return
    }
    onComplete(responses)
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((value) => value - 1)
    } else if (currentIndex === 0 && hasWelcome) {
      setCurrentIndex(-1)
    }
  }

  if (currentIndex < 0) {
    return (
      <div className="form-stepper anamnesis-stepper">
        <div className="anamnesis-welcome">
          <span className="welcome-kicker">{form.welcome.kicker}</span>
          <h2>{form.welcome.title}</h2>
          <p>{form.welcome.body}</p>
          <div className="trust-grid">
            {form.welcome.points?.map((point) => (
              <div key={point.title} className="trust-card">
                <strong>{point.title}</strong>
                <span>{point.text}</span>
              </div>
            ))}
          </div>
          <p className="consultation-disclaimer">{form.welcome.disclaimer}</p>
        </div>
        <div className="stepper-actions">
          <span />
          <Button variant="primary" onClick={handleNext}>
            Begin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`form-stepper ${form.kind === 'anamnesis' ? 'anamnesis-stepper' : ''}`}>
      <div className="stepper-header">
        <div>
          <h2>{form.title}</h2>
          <p>{form.description}</p>
        </div>
        <div className="stepper-progress">
          <span>{`Question ${currentIndex + 1} / ${form.questions.length}`}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="stepper-card">
        <div className="stepper-question-meta">
          <span>Category: {currentQuestion.category}</span>
          <span>{currentQuestion.required ? 'Required' : 'Optional'}</span>
        </div>

        <h3>{currentQuestion.text}</h3>
        {currentQuestion.helper && <p className="question-helper">{currentQuestion.helper}</p>}
        <div className="stepper-field">
          {renderQuestionField(currentQuestion, responses[currentQuestion.id], handleChange)}
        </div>
      </div>

      <div className="stepper-actions">
        <Button variant="outline" onClick={handleBack} disabled={currentIndex === 0}>
          Back
        </Button>
        {onFinishLater && (
          <button
            type="button"
            className="stepper-finish-later-btn"
            onClick={() => onFinishLater(responses)}
          >
            Finish Later
          </button>
        )}
        <Button variant="primary" onClick={handleNext}>
          {currentIndex < form.questions.length - 1 ? 'Next' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
