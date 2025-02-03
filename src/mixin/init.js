import controller from './controller'

function init (instance) {
  // assign modules
  modules(instance)

  controller.register(instance)

  return instance
}

function modules (instance) {
  const modules = instance.options.modules

  for (let i = 0; i < modules.length; i++) {
    if (typeof modules[i] === 'function') {
      modules[i](instance)
    } else {
      Object.assign(instance, modules[i])
    }
  }
}

export default init
