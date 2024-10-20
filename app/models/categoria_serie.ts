import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class CategoriaSerie extends compose(BaseModel, SoftDeletes)  {
  @column()
  declare serieId: number

  @column()
  declare categoriaId: number
  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}