import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'personajes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('nombre').notNullable() 
      table.integer('serie_id').unsigned().references('id').inTable('series').onDelete('CASCADE') // ID de la serie
      table.integer('actor_id').unsigned().references('id').inTable('actors').onDelete('CASCADE') // ID del acto
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable() 
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}