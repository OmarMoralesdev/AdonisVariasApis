import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Director from './director.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
export default class Serie extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare nombre: string

  @column()
  declare descripcion: string

  @column()
  declare anio: number
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
  @belongsTo(() => Director)
  declare director: BelongsTo<typeof Director>;
}