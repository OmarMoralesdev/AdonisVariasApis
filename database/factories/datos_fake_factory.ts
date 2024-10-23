import factory from '@adonisjs/lucid/factories'
import DatosFake from '#models/datos_fake'

export const DatosFakeFactory = factory
  .define(DatosFake, async ({ faker }) => {
    return {}
  })
  .build()