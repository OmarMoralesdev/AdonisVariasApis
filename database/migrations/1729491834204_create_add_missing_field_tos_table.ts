import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'escenas'

  async up() {
    this.schema.alterTable('escenas', (table) => {
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('escenas', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}