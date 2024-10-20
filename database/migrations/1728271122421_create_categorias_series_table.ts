import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categoria_series'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments()
      table.integer('series_id').unsigned().references('id').inTable('series').onDelete('CASCADE')
      table.integer('category_id').unsigned().references('id').inTable('categorias').onDelete('CASCADE')
      table.timestamp('deleted_at').nullable() 
      table.timestamps()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}