import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  protected tableName = 'escenas' 

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('descripcion').notNullable()
      table.integer('episodio_id').unsigned().references('id').inTable('episodios').onDelete('CASCADE') 
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable() 
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
