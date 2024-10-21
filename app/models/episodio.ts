import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
export default class Episodio extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare nombre: string;

  @column()
  declare nacionalidad: string;

  @column()
  declare temporada_id: number
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}