import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'series'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id'); 
      table.string('nombre').notNullable();
      table.text('descripcion').notNullable(); 
      table.integer('anio').notNullable(); 
      table.integer('director_id').unsigned().references('id').inTable('directors').onDelete('SET NULL'); 
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()); 
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()); 
      table.timestamp('deleted_at').nullable() 
    });
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}