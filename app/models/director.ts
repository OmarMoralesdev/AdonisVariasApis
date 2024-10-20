import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Serie from './serie.js';
import * as relations from '@adonisjs/lucid/types/relations';
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class Director extends compose(BaseModel, SoftDeletes){
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nombre: string;

  @column()
  declare nacionalidad: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
  @hasMany(() => Serie)
  declare series: relations.HasMany<typeof Serie>;
}