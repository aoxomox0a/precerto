import React, { useState, useEffect } from 'react'
import { useHealthcare } from '../../src/context/HealthcareContext'
import './PatientFormFiller.css'

export default function PatientFormFiller({ patientId, assignmentId, onBack, onSubmit }) {
  const { formAssignments, formTemplates, submitForm } = useHealthcare()
  const [formValues, setFormValues] = useState({})
  const [submitted, setSubmitted] = useState(false)

  // Find the assignment and form
  const assignment = formAssignments.find(a => a.id === assignmentId)
  const form = formTemplates.find(f => f.id === assignment?.formId)

  // Initialize form values
  useEffect(() => {
    if (form) {
      const initialValues = {}
      form.categories.forEach(category => {
        initialValues[category.id] = {}
        category.fields.forEach(field => {
          initialValues[category.id][field.id] = field.value
        })
      })
      setFormValues(initialValues)
    }
  }, [form])

  if (!form || !assignment) {
    return <div className="text-center p-8">Form not found</div>
  }

  const handleFieldChange = (categoryId, fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [fieldId]: value
      }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitForm(assignmentId, formValues)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-12 max-w-md text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Form Submitted!</h1>
          <p className="text-gray-700 mb-8">Your responses have been saved and submitted to your care team.</p>
          <button
            onClick={onBack}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Back to Forms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-4 font-semibold text-lg"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{form.title}</h1>
          <p className="text-gray-600 text-lg mb-4">{form.description}</p>
          <div className="flex gap-6 text-sm text-gray-600">
            <span>Due Date: <strong>{assignment.dueDate}</strong></span>
            <span>Assigned by: <strong>{assignment.doctorName || 'Your Doctor'}</strong></span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {form.categories.map(category => (
            <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <h2 className="text-2xl font-bold">{category.name}</h2>
              </div>

              {/* Category Fields */}
              <div className="p-8 space-y-6">
                {category.fields.map(field => (
                  <div key={field.id} className="form-field">
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      {field.label}
                    </label>

                    {field.type === 'number' && (
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={formValues[category.id]?.[field.id] ?? ''}
                        onChange={(e) =>
                          handleFieldChange(categoryId, field.id, e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={formValues[category.id]?.[field.id] ?? ''}
                        onChange={(e) =>
                          handleFieldChange(category.id, field.id, e.target.value)
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        value={formValues[category.id]?.[field.id] ?? ''}
                        onChange={(e) =>
                          handleFieldChange(category.id, field.id, e.target.value)
                        }
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}

                    {field.type === 'slider' && (
                      <div>
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          value={formValues[category.id]?.[field.id] ?? field.min}
                          onChange={(e) =>
                            handleFieldChange(category.id, field.id, Number(e.target.value))
                          }
                          className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <span>{field.min}</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formValues[category.id]?.[field.id] ?? field.min}
                          </span>
                          <span>{field.max}</span>
                        </div>
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formValues[category.id]?.[field.id] ?? false}
                          onChange={(e) =>
                            handleFieldChange(category.id, field.id, e.target.checked)
                          }
                          className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 text-lg">{field.label}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-4 rounded-lg font-bold text-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition"
            >
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
