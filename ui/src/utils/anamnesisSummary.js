const listValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not reported'
  return value || 'Not reported'
}

export const buildAnamnesisSummary = (responses = {}) => {
  const heightCm = Number(responses['anam-height'])
  const weightKg = Number(responses['anam-weight'])
  const bmi =
    heightCm > 0 && weightKg > 0
      ? (weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1)
      : 'Not available'
  const conditions = Array.isArray(responses['anam-conditions']) ? responses['anam-conditions'] : []
  const symptoms = Array.isArray(responses['anam-symptoms']) ? responses['anam-symptoms'] : []
  const limitations = Array.isArray(responses['anam-limitations'])
    ? responses['anam-limitations']
    : []
  const symptomImpact = Number(responses['anam-symptom-impact'] ?? 0)
  const psychologicalManageability = Number(responses['anam-psych-impact'] ?? 0)
  const motivation = Number(responses['anam-motivation'] ?? 0)
  const riskIndicators = []

  if (conditions.some((item) => !['None known'].includes(item))) {
    riskIndicators.push('Comorbidity context reported')
  }
  if (symptomImpact >= 7) riskIndicators.push('High daily symptom impact')
  if (psychologicalManageability <= 3) riskIndicators.push('Low emotional manageability')
  if (limitations.some((item) => !['None'].includes(item))) {
    riskIndicators.push('Physical limitations may affect care plan')
  }
  if (responses['anam-weight-history'] === 'Significant change') {
    riskIndicators.push('Significant weight change reported')
  }

  return [
    { label: 'BMI', value: bmi },
    { label: 'Comorbidities', value: listValue(conditions) },
    { label: 'Symptom clusters', value: listValue(symptoms) },
    { label: 'Physical limitations', value: listValue(limitations) },
    {
      label: 'Psychological impact',
      value:
        psychologicalManageability > 0
          ? `${psychologicalManageability}/10 emotional manageability`
          : 'Not reported',
    },
    { label: 'Motivation score', value: motivation > 0 ? `${motivation}/10` : 'Not reported' },
    { label: 'Risk indicators', value: riskIndicators.length ? riskIndicators.join(', ') : 'No major flags from structured intake' },
    {
      label: 'Care orientation suggestions',
      value:
        motivation >= 7
          ? 'Collaborative goal setting and action planning may be well received.'
          : 'Use motivational interviewing and explore barriers gently during consultation.',
    },
  ]
}
