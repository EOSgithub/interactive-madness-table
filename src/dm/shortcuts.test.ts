import { describe, expect, it } from 'vitest'
import { belongsToPage, keyName } from './shortcuts'

const plain = { ctrlKey: false, metaKey: false, altKey: false, repeat: false }

describe('keyName', () => {
  it('names letters in lower case and the space bar as "space"', () => {
    expect(keyName('R')).toBe('r')
    expect(keyName(' ')).toBe('space')
    expect(keyName('Escape')).toBe('escape')
  })
})

describe('belongsToPage', () => {
  it('lets a plain key through when nothing has focus', () => {
    expect(belongsToPage(plain, 'r', 'BODY', false)).toBe(false)
    expect(belongsToPage(plain, 'space', 'BODY', false)).toBe(false)
  })

  it('leaves the key alone while the DM is typing', () => {
    expect(belongsToPage(plain, 'r', 'INPUT', false)).toBe(true)
    expect(belongsToPage(plain, 'b', 'TEXTAREA', false)).toBe(true)
    expect(belongsToPage(plain, '1', 'DIV', true)).toBe(true)
  })

  it('leaves browser shortcuts and held keys alone', () => {
    expect(belongsToPage({ ...plain, ctrlKey: true }, 'r', 'BODY', false)).toBe(true)
    expect(belongsToPage({ ...plain, metaKey: true }, 'b', 'BODY', false)).toBe(true)
    expect(belongsToPage({ ...plain, repeat: true }, 'space', 'BODY', false)).toBe(true)
  })

  it('lets space press the focused button, and still takes letters there', () => {
    expect(belongsToPage(plain, 'space', 'BUTTON', false)).toBe(true)
    expect(belongsToPage(plain, 'r', 'BUTTON', false)).toBe(false)
  })
})
