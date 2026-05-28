'use client'

import { type Section, type Field } from '@/lib/dev-request-fields'

export function FormSection({
  section,
  fields,
  onChange,
}: {
  section: Section
  fields: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">{section.title}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {groupFields(section.fields).map((row) =>
          Array.isArray(row) ? (
            <div key={row[0].key} className="px-5 py-3 flex gap-6">
              {row.map((field) => (
                <div key={field.key} className="flex-1 flex gap-3 items-center">
                  <span className="shrink-0 text-xs text-gray-500">{field.label}</span>
                  <input
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={fields[field.key] ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="flex-1 text-sm text-gray-800 focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
                  />
                </div>
              ))}
            </div>
          ) : (
            <FieldRow key={row.key} field={row} fields={fields} onChange={onChange} />
          )
        )}
      </div>
    </div>
  )
}

export function groupFields(fields: Field[]): (Field | [Field, Field])[] {
  const rows: (Field | [Field, Field])[] = []
  let i = 0
  while (i < fields.length) {
    if (fields[i].sameRowAsNext && i + 1 < fields.length) {
      rows.push([fields[i], fields[i + 1]])
      i += 2
    } else {
      rows.push(fields[i])
      i++
    }
  }
  return rows
}

function FieldRow({
  field,
  fields,
  onChange,
}: {
  field: Field
  fields: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const showConditional = field.conditionalField && (
    field.type === 'select'
      ? fields[field.key] === field.conditionalField.whenValue
      : fields[field.key]?.split(',').map((v) => v.trim()).includes(field.conditionalField.whenValue)
  )

  const clearConditionalFields = (cf: typeof field.conditionalField) => {
    cf?.fields.forEach((sub) => onChange(sub.key, ''))
  }

  return (
    <>
      <div className="px-5 py-3 flex gap-4 items-start">
        <span className="shrink-0 w-40 text-xs text-gray-500 pt-2">{field.label}</span>
        {field.type === 'multiselect' && field.options ? (
          <MultiSelectField
            options={field.options}
            value={fields[field.key] ?? ''}
            onChange={(val) => {
              onChange(field.key, val)
              if (field.conditionalField) {
                const selected = val.split(',').map((v) => v.trim()).filter(Boolean)
                if (!selected.includes(field.conditionalField.whenValue)) {
                  clearConditionalFields(field.conditionalField)
                }
              }
            }}
          />
        ) : field.type === 'select' && field.options ? (
          <SelectField
            options={field.options}
            value={fields[field.key] ?? ''}
            onChange={(val) => {
              onChange(field.key, val)
              if (field.conditionalField && val !== field.conditionalField.whenValue) {
                clearConditionalFields(field.conditionalField)
              }
            }}
          />
        ) : field.type === 'textarea' ? (
          <textarea
            value={fields[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            rows={3}
            className="flex-1 text-sm text-gray-800 resize-none focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
          />
        ) : (
          <input
            type={field.type === 'date' ? 'date' : 'text'}
            value={fields[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="flex-1 text-sm text-gray-800 focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
          />
        )}
      </div>
      {showConditional && field.conditionalField?.fields.map((sub) => (
        <div key={sub.key} className="px-5 py-3 flex gap-4 items-start bg-gray-50">
          <span className="shrink-0 w-40 text-xs text-gray-500 pt-2">{sub.label}</span>
          {sub.type === 'select' && sub.options ? (
            <SelectField
              options={sub.options}
              value={fields[sub.key] ?? ''}
              onChange={(val) => onChange(sub.key, val)}
            />
          ) : sub.type === 'multiselect' && sub.options ? (
            <MultiSelectField
              options={sub.options}
              value={fields[sub.key] ?? ''}
              onChange={(val) => onChange(sub.key, val)}
            />
          ) : sub.type === 'textarea' ? (
            <textarea
              value={fields[sub.key] ?? ''}
              onChange={(e) => onChange(sub.key, e.target.value)}
              rows={3}
              placeholder={sub.placeholder ?? ''}
              className="flex-1 text-sm text-gray-800 resize-none focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
            />
          ) : (
            <input
              type="text"
              value={fields[sub.key] ?? ''}
              onChange={(e) => onChange(sub.key, e.target.value)}
              placeholder={sub.placeholder ?? ''}
              className="flex-1 text-sm text-gray-800 focus:outline-none focus:bg-blue-50 rounded px-2 py-1.5 border border-transparent hover:border-gray-200 transition-colors"
            />
          )}
        </div>
      ))}
    </>
  )
}

function SelectField({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex-1 flex flex-wrap gap-2 py-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(value === option ? '' : option)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            value === option
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function MultiSelectField({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  const selected = value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []
  const ALL_LABEL = '모두'
  const hasAllOption = options.includes(ALL_LABEL)
  const regularOptions = options.filter((o) => o !== ALL_LABEL)

  const toggle = (option: string) => {
    if (hasAllOption && option === ALL_LABEL) {
      const isAllSelected = selected.includes(ALL_LABEL)
      const next = isAllSelected ? [] : [...regularOptions, ALL_LABEL]
      onChange(next.join(', '))
      return
    }

    const base = selected.filter((s) => s !== ALL_LABEL)
    const toggled = base.includes(option)
      ? base.filter((s) => s !== option)
      : [...base, option]
    const allRegularSelected = hasAllOption && regularOptions.every((o) => toggled.includes(o))
    const next = allRegularSelected ? [...toggled, ALL_LABEL] : toggled
    onChange(next.join(', '))
  }

  return (
    <div className="flex-1 flex flex-wrap gap-2 py-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            selected.includes(option)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
