import React, { useMemo, useState } from 'react'
import { useAppContext } from '../../../src/store/AppProvider'
import { Button } from '../../../src/components/shared'
import './doctor-pages.css'

const STANDARD_QUESTIONS = [
  {
    id: 'std-chief-complaint',
    text: 'What is your main reason for today\'s consultation?',
    type: 'textarea',
    category: 'Symptoms',
    required: true,
  },
  {
    id: 'std-symptom-duration',
    text: 'How long have you had these symptoms?',
    type: 'radio',
    category: 'Symptoms',
    options: ['Less than 24 hours', '1-7 days', '1-4 weeks', 'More than 1 month'],
    required: true,
  },
  {
    id: 'std-pain-severity',
    text: 'Rate your pain or discomfort from 0 to 10.',
    type: 'number',
    category: 'Symptoms',
    required: true,
  },
  {
    id: 'std-current-meds',
    text: 'List all current medications, including dosage if known.',
    type: 'textarea',
    category: 'Medication',
    required: false,
  },
  {
    id: 'std-allergies',
    text: 'Do you have any allergies to medications, foods, or materials?',
    type: 'textarea',
    category: 'Allergies',
    required: true,
  },
  {
    id: 'std-medical-history',
    text: 'Have you been diagnosed with any chronic medical conditions?',
    type: 'textarea',
    category: 'Medical History',
    required: true,
  },
  {
    id: 'std-family-history',
    text: 'Is there any relevant family medical history?',
    type: 'textarea',
    category: 'Medical History',
    required: false,
  },
  {
    id: 'std-smoking',
    text: 'Do you currently smoke or use nicotine products?',
    type: 'radio',
    category: 'Lifestyle',
    options: ['No', 'Occasionally', 'Daily', 'Former smoker'],
    required: true,
  },
  {
    id: 'std-pregnancy',
    text: 'Are you currently pregnant or could you be pregnant?',
    type: 'radio',
    category: 'Screening',
    options: ['No', 'Yes', 'Unsure', 'Not applicable'],
    required: false,
  },
  {
    id: 'std-red-flags',
    text: 'Which urgent symptoms have you experienced?',
    type: 'checkbox',
    category: 'Safety',
    options: ['Fever', 'Fainting', 'Chest pain', 'Severe shortness of breath', 'Sudden weakness'],
    required: true,
  },
]

const OPTION_QUESTION_TYPES = ['radio', 'select', 'checkbox']

const createQuestionInstance = (question) => ({
  ...question,
  id: `q-${Date.now()}-${Math.random().toString(16).slice(2)}`,
})

const emptyForm = {
  title: '',
  description: '',
  category: 'Custom',
  questions: [],
}

export const DoctorFormManagement = ({ selectedDoctor }) => {
  const {
    getDoctorPatients,
    getDoctorForms,
    createForm,
    updateForm,
    deleteForm,
    assignFormToPatient,
  } = useAppContext()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [builderTab, setBuilderTab] = useState('standard')
  const [editingFormId, setEditingFormId] = useState(null)
  const [editingBackendId, setEditingBackendId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const [customQuestion, setCustomQuestion] = useState({
    text: '',
    type: 'textarea',
    category: 'Personalized',
    required: true,
    options: '',
    scaleMin: 0,
    scaleMax: 10,
    scaleMinLabel: 'Low',
    scaleMaxLabel: 'High',
  })
  const [assignTarget, setAssignTarget] = useState({ patientId: '', formId: '' })
  const [draggedQuestionId, setDraggedQuestionId] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')

  const doctorForms = getDoctorForms(selectedDoctor.id)
  const doctorPatients = getDoctorPatients(selectedDoctor.id)
  const canSaveForm = formData.title.trim() && formData.description.trim() && formData.questions.length > 0

  const selectedAssignForm = useMemo(
    () => doctorForms.find((form) => form.id === assignTarget.formId),
    [assignTarget.formId, doctorForms]
  )

  const resetBuilder = () => {
    setFormData(emptyForm)
    setActionError('')
    setCustomQuestion({
      text: '',
      type: 'textarea',
      category: 'Personalized',
      required: true,
      options: '',
      scaleMin: 0,
      scaleMax: 10,
      scaleMinLabel: 'Low',
      scaleMaxLabel: 'High',
    })
    setEditingFormId(null)
    setEditingBackendId(null)
    setBuilderTab('standard')
    setDraggedQuestionId(null)
  }

  const toggleBuilder = () => {
    if (showCreateForm) {
      resetBuilder()
      setShowCreateForm(false)
      return
    }

    resetBuilder()
    setShowCreateForm(true)
  }

  const addQuestionToForm = (question) => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, createQuestionInstance(question)],
    }))
  }

  const removeQuestionFromForm = (questionId) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((question) => question.id !== questionId),
    }))
  }

  const moveQuestion = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return

    setFormData((prev) => {
      const nextQuestions = [...prev.questions]
      const [movedQuestion] = nextQuestions.splice(fromIndex, 1)
      nextQuestions.splice(toIndex, 0, movedQuestion)
      return { ...prev, questions: nextQuestions }
    })
  }

  const handleDropStandardQuestion = (event) => {
    event.preventDefault()
    const questionId = event.dataTransfer.getData('question-id')
    const question = STANDARD_QUESTIONS.find((item) => item.id === questionId)
    if (question) addQuestionToForm(question)
  }

  const handleAddCustomQuestion = () => {
    const questionText = customQuestion.text.trim()
    if (!questionText) return

    const parsedOptions = customQuestion.options
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean)
    const scaleMin = Number(customQuestion.scaleMin)
    const scaleMax = Number(customQuestion.scaleMax)
    const isOptionQuestion = OPTION_QUESTION_TYPES.includes(customQuestion.type)
    const isScaleQuestion = customQuestion.type === 'scale'

    if (isOptionQuestion && parsedOptions.length < 2) return
    if (isScaleQuestion && (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax) || scaleMin >= scaleMax)) return

    const question = {
      id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: questionText,
      type: customQuestion.type,
      category: customQuestion.category.trim() || 'Personalized',
      required: customQuestion.required,
      options: isOptionQuestion ? parsedOptions : undefined,
      scale:
        customQuestion.type === 'scale'
          ? {
              min: scaleMin,
              max: scaleMax,
              minLabel: customQuestion.scaleMinLabel.trim() || 'Low',
              maxLabel: customQuestion.scaleMaxLabel.trim() || 'High',
            }
          : undefined,
    }

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }))
    setCustomQuestion({
      text: '',
      type: 'textarea',
      category: 'Personalized',
      required: true,
      options: '',
      scaleMin: 0,
      scaleMax: 10,
      scaleMinLabel: 'Low',
      scaleMaxLabel: 'High',
    })
  }

  const canAddCustomQuestion = (() => {
    if (!customQuestion.text.trim()) return false
    if (OPTION_QUESTION_TYPES.includes(customQuestion.type)) {
      return customQuestion.options
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean).length >= 2
    }
    if (customQuestion.type === 'scale') {
      const scaleMin = Number(customQuestion.scaleMin)
      const scaleMax = Number(customQuestion.scaleMax)
      return Number.isFinite(scaleMin) && Number.isFinite(scaleMax) && scaleMin < scaleMax
    }
    return true
  })()

  const handleSaveForm = async () => {
    if (!canSaveForm) return

    const savedForm = {
      id: editingFormId || `form-${Date.now()}`,
      backendId: editingBackendId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category || 'Custom',
      createdBy: selectedDoctor.id,
      createdAt: editingFormId
        ? doctorForms.find((form) => form.id === editingFormId)?.createdAt
        : new Date().toISOString().split('T')[0],
      isCustom: true,
      questions: formData.questions,
    }

    try {
      if (editingFormId) {
        await updateForm(savedForm)
        showSuccess('Form updated successfully.')
      } else {
        await createForm(savedForm)
        showSuccess(`Form "${savedForm.title}" created successfully.`)
      }

      resetBuilder()
      setShowCreateForm(false)
    } catch (error) {
      setActionError(error.message || 'Unable to save form to the backend.')
    }
  }

  const handleEditForm = (form) => {
    if (editingFormId === form.id) {
      resetBuilder()
      setShowCreateForm(false)
      return
    }

    setFormData({
      title: form.title,
      description: form.description,
      category: form.category || 'Custom',
      questions: form.questions || [],
    })
    setEditingFormId(form.id)
    setEditingBackendId(form.backendId || Number(String(form.id).replace('form-', '')) || null)
    setActionError('')
    setShowCreateForm(true)
    setBuilderTab('standard')
  }

  const showSuccess = (message) => {
    setActionSuccess(message)
    setTimeout(() => setActionSuccess(''), 3000)
  }

  const handleAssignForm = async () => {
    if (!assignTarget.patientId || !assignTarget.formId) return

    try {
      setActionError('')
      await assignFormToPatient({
        formId: assignTarget.formId,
        patientId: assignTarget.patientId,
        doctorId: selectedDoctor.id,
      })
      const patient = doctorPatients.find(p => p.id === assignTarget.patientId)
      const form = doctorForms.find(f => f.id === assignTarget.formId)
      showSuccess(`"${form?.title}" assigned to ${patient?.name} successfully.`)
      setAssignTarget({ patientId: '', formId: '' })
    } catch (error) {
      setActionError(error.message || 'Unable to assign form to patient.')
    }
  }

  const renderFormBuilder = () => (
    <div className="form-builder">
      <div className="builder-details">
        <input
          type="text"
          placeholder="Form title"
          value={formData.title}
          onChange={(event) => setFormData({ ...formData, title: event.target.value })}
        />
        <textarea
          placeholder="Form description"
          value={formData.description}
          onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          rows="3"
        />
      </div>

      <div className="builder-tabs" role="tablist" aria-label="Question builder tabs">
        <button
          className={`builder-tab ${builderTab === 'standard' ? 'active' : ''}`}
          onClick={() => setBuilderTab('standard')}
          type="button"
        >
          Standardized Questions
        </button>
        <button
          className={`builder-tab ${builderTab === 'personalized' ? 'active' : ''}`}
          onClick={() => setBuilderTab('personalized')}
          type="button"
        >
          Personalized Questions
        </button>
      </div>

      <div className="builder-grid">
        <div className="question-source">
          {builderTab === 'standard' ? (
            <>
              <h3>Medical Question Bank</h3>
              <div className="standard-question-list">
                {STANDARD_QUESTIONS.map((question) => (
                  <div
                    key={question.id}
                    className="standard-question"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('question-id', question.id)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                  >
                    <span className="question-category">{question.category}</span>
                    <p>{question.text}</p>
                    <small>{question.type}{question.required ? ' - Required' : ' - Optional'}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>Create Personalized Question</h3>
              <div className="custom-question-form">
                <textarea
                  placeholder="Question text"
                  value={customQuestion.text}
                  onChange={(event) =>
                    setCustomQuestion({ ...customQuestion, text: event.target.value })
                  }
                  rows="4"
                />
                <div className="custom-question-row">
                  <select
                    value={customQuestion.type}
                    onChange={(event) =>
                      setCustomQuestion({ ...customQuestion, type: event.target.value })
                    }
                  >
                    <option value="textarea">Long answer</option>
                    <option value="text">Short answer</option>
                    <option value="number">Number</option>
                    <option value="radio">Single choice</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkboxes</option>
                    <option value="scale">Scale</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Category"
                    value={customQuestion.category}
                    onChange={(event) =>
                      setCustomQuestion({ ...customQuestion, category: event.target.value })
                    }
                  />
                </div>
                {OPTION_QUESTION_TYPES.includes(customQuestion.type) && (
                  <div className="custom-options-block">
                    <label>Answer options</label>
                    <input
                      type="text"
                      placeholder="Example: Never, Sometimes, Often"
                      value={customQuestion.options}
                      onChange={(event) =>
                        setCustomQuestion({ ...customQuestion, options: event.target.value })
                      }
                    />
                    <small>Add at least two options, separated by commas.</small>
                  </div>
                )}
                {customQuestion.type === 'scale' && (
                  <div className="scale-settings">
                    <div className="custom-question-row">
                      <label>
                        Minimum
                        <input
                          type="number"
                          value={customQuestion.scaleMin}
                          onChange={(event) =>
                            setCustomQuestion({ ...customQuestion, scaleMin: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Maximum
                        <input
                          type="number"
                          value={customQuestion.scaleMax}
                          onChange={(event) =>
                            setCustomQuestion({ ...customQuestion, scaleMax: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="custom-question-row">
                      <input
                        type="text"
                        placeholder="Minimum label, e.g. No pain"
                        value={customQuestion.scaleMinLabel}
                        onChange={(event) =>
                          setCustomQuestion({ ...customQuestion, scaleMinLabel: event.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Maximum label, e.g. Worst pain"
                        value={customQuestion.scaleMaxLabel}
                        onChange={(event) =>
                          setCustomQuestion({ ...customQuestion, scaleMaxLabel: event.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
                <label className="required-toggle">
                  <input
                    type="checkbox"
                    checked={customQuestion.required}
                    onChange={(event) =>
                      setCustomQuestion({ ...customQuestion, required: event.target.checked })
                    }
                  />
                  Required question
                </label>
                <Button
                  variant="secondary"
                  onClick={handleAddCustomQuestion}
                  disabled={!canAddCustomQuestion}
                >
                  Add Question
                </Button>
              </div>
            </>
          )}
        </div>

        <div
          className="form-drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropStandardQuestion}
        >
          <div className="drop-zone-header">
            <h3>Form Questions</h3>
            <span>{formData.questions.length} selected</span>
          </div>

          {formData.questions.length === 0 ? (
            <div className="drop-zone-empty">
              Drag standardized questions here or add personalized questions.
            </div>
          ) : (
            <div className="selected-question-list">
              {formData.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="selected-question"
                  draggable
                  onDragStart={() => setDraggedQuestionId(question.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    const fromIndex = formData.questions.findIndex(
                      (item) => item.id === draggedQuestionId
                    )
                    moveQuestion(fromIndex, index)
                  }}
                >
                  <div className="selected-question-order">{index + 1}</div>
                  <div className="selected-question-body">
                    <span className="question-category">{question.category}</span>
                    <p>{question.text}</p>
                    <small>{question.type}{question.required ? ' - Required' : ' - Optional'}</small>
                  </div>
                  <button
                    className="remove-question-button"
                    type="button"
                    onClick={() => removeQuestionFromForm(question.id)}
                    aria-label={`Remove question ${index + 1}`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="builder-actions">
            <Button variant="outline" onClick={toggleBuilder}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSaveForm} disabled={!canSaveForm}>
              {editingFormId ? 'Save Changes' : 'Save Form'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="doctor-form-management">
      <div className="section-header">
        <h2>Form Management</h2>
        <div className="action-buttons">
          <Button variant="primary" size="sm" onClick={toggleBuilder}>
            {showCreateForm ? 'Close Builder' : '+ Create Form'}
          </Button>
        </div>
      </div>

      {actionError ? <p className="submit-error">{actionError}</p> : null}
      {actionSuccess ? <p className="assign-success-message">{actionSuccess}</p> : null}

      {showCreateForm && !editingFormId ? renderFormBuilder() : null}

      <div className="assign-form-container">
        <h3>Assign Form to Patient</h3>
        <div className="assign-controls">
          <select
            value={assignTarget.formId}
            onChange={(event) => setAssignTarget({ ...assignTarget, formId: event.target.value })}
          >
            <option value="">Select a form</option>
            {doctorForms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
          <select
            value={assignTarget.patientId}
            onChange={(event) =>
              setAssignTarget({ ...assignTarget, patientId: event.target.value })
            }
          >
            <option value="">Select a patient</option>
            {doctorPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.age})
              </option>
            ))}
          </select>
          <Button variant="success" onClick={handleAssignForm} disabled={!assignTarget.formId || !assignTarget.patientId}>
            Assign
          </Button>
        </div>
        {selectedAssignForm && (
          <p className="assign-preview">
            {selectedAssignForm.questions?.length || 0} questions will be sent to the selected patient.
          </p>
        )}
      </div>

      <div className="forms-list">
        {doctorForms.length === 0 ? (
          <p className="empty-state">No forms created yet</p>
        ) : (
          doctorForms.map((form) => (
            <div key={form.id} className="form-item form-item-expanded">
              <div className="form-item-info">
                <h4>{form.title}</h4>
                <p>{form.description}</p>
                <small>
                  {form.isCustom ? 'Custom Form' : 'Standard Form'} - {form.createdAt} -{' '}
                  {form.questions?.length || 0} questions
                </small>
              </div>
              <div className="form-item-actions">
                <Button variant="secondary" size="sm" onClick={() => handleEditForm(form)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignTarget({ ...assignTarget, formId: form.id })}
                >
                  Assign
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteForm(form.id).catch((error) => setActionError(error.message || 'Unable to delete form.'))}
                >
                  Delete
                </Button>
              </div>
              {editingFormId === form.id ? (
                <div style={{ marginTop: '1rem' }}>
                  {renderFormBuilder()}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
