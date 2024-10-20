import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'episodios'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('titulo').notNullable()
      table
        .integer('temporada_id')
        .unsigned()
        .references('id')
        .inTable('temporadas')
        .onDelete('CASCADE')
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable() 
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}