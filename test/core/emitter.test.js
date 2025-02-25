// test/core/state/emitter.test.js
import { describe, test, expect, mock } from 'bun:test'
import { createEmitter } from '../../src/core/state/emitter'

describe('Event Emitter', () => {
  test('should create an emitter with expected methods', () => {
    const emitter = createEmitter()
    expect(emitter).toBeDefined()
    expect(emitter.on).toBeInstanceOf(Function)
    expect(emitter.off).toBeInstanceOf(Function)
    expect(emitter.emit).toBeInstanceOf(Function)
    expect(emitter.clear).toBeInstanceOf(Function)
  })

  test('should register event handlers with on()', () => {
    const emitter = createEmitter()
    const handler = mock(() => {})

    const unsubscribe = emitter.on('test', handler)

    expect(unsubscribe).toBeInstanceOf(Function)
  })

  test('should invoke handlers when event is emitted', () => {
    const emitter = createEmitter()
    const handler1 = mock(() => {})
    const handler2 = mock(() => {})
    const eventData = { foo: 'bar' }

    emitter.on('test', handler1)
    emitter.on('test', handler2)

    emitter.emit('test', eventData)

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler1).toHaveBeenCalledWith(eventData)

    expect(handler2).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledWith(eventData)
  })

  test('should remove handlers with off()', () => {
    const emitter = createEmitter()
    const handler = mock(() => {})

    emitter.on('test', handler)
    emitter.off('test', handler)

    emitter.emit('test')

    expect(handler).not.toHaveBeenCalled()
  })

  test('should remove specific handlers while keeping others', () => {
    const emitter = createEmitter()
    const handler1 = mock(() => {})
    const handler2 = mock(() => {})

    emitter.on('test', handler1)
    emitter.on('test', handler2)

    emitter.off('test', handler1)

    emitter.emit('test')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  test('should unsubscribe handlers using the returned function', () => {
    const emitter = createEmitter()
    const handler = mock(() => {})

    const unsubscribe = emitter.on('test', handler)
    unsubscribe()

    emitter.emit('test')

    expect(handler).not.toHaveBeenCalled()
  })

  test('should support multiple event types', () => {
    const emitter = createEmitter()
    const handler1 = mock(() => {})
    const handler2 = mock(() => {})

    emitter.on('event1', handler1)
    emitter.on('event2', handler2)

    emitter.emit('event1')

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).not.toHaveBeenCalled()

    emitter.emit('event2')

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  test('should clear all event handlers', () => {
    const emitter = createEmitter()
    const handler1 = mock(() => {})
    const handler2 = mock(() => {})

    emitter.on('event1', handler1)
    emitter.on('event2', handler2)

    emitter.clear()

    emitter.emit('event1')
    emitter.emit('event2')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  test('should pass multiple arguments to handlers', () => {
    const emitter = createEmitter()
    const handler = mock(() => {})

    emitter.on('test', handler)

    const arg1 = { id: 1 }
    const arg2 = 'string'
    const arg3 = [1, 2, 3]

    emitter.emit('test', arg1, arg2, arg3)

    expect(handler).toHaveBeenCalledWith(arg1, arg2, arg3)
  })

  test('should do nothing when emitting event with no handlers', () => {
    const emitter = createEmitter()

    // This should not throw
    expect(() => {
      emitter.emit('nonexistent')
    }).not.toThrow()
  })
})
