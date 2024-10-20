import SpecialEvent from '#models/evento_especial';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';

export default class EventoEspecialControladorsController {
  
  // Método para obtener todos los eventos especiales y consultar a la API externa
  public async index({ response }: HttpContext) {
    try {
    

      // Obtén los eventos especiales locales
      const eventosEspeciales = await SpecialEvent.all();

      // Devuelve tanto los eventos locales como los datos de la API externa
      return response.json({ local: eventosEspeciales });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar un nuevo evento especial y enviar datos falsos a la API externa
  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'fecha']);
    const eventoEspecial = await SpecialEvent.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeEventData(response);

    return response.status(201).json(eventoEspecial);
  }

  // Método para mostrar un evento especial específico y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/ventas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca el evento especial en la base de datos local
      const eventoEspecial = await SpecialEvent.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: eventoEspecial, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar un evento especial y enviar datos a la API externa
  public async update({ params, request, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    eventoEspecial.merge(request.only(['nombre', 'fecha']));
    await eventoEspecial.save();

    try {
      // Enviar actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/ventas/${params.id}`, request.only(['nombre', 'fecha']));
      return response.json({
        eventoEspecial,
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al enviar datos a la API:', error);
      return response.status(500).json({
        message: 'Error al enviar datos a la API',
        error: error.message,
      });
    }
  }

  // Método para eliminar un evento especial y enviar datos a la API externa
  public async destroy({ params, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    await eventoEspecial.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/ventas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Evento especial eliminado exitosamente',
        apiResponse: apiResponse.data,
      });
    } catch (error) {
      console.error('Error al eliminar datos en la API externa:', error);
      return response.status(500).json({
        message: 'Error al eliminar datos en la API externa',
        error: error.message,
      });
    }
  }

  // Método privado para generar datos falsos del evento especial
  private generateFakeEventData() {
    return {
      fecha_hora: faker.date.recent(),
      f_pago: faker.helpers.arrayElement(['efectivo', 'debito', 'credito']),
      id_empleado: faker.number.int({ min: 1, max: 5 }),
    };
  }

  // Método para enviar datos falsos a la API externa
  public async sendFakeEventData(response: HttpContext['response']) {
    const fakeData = this.generateFakeEventData(); // Genera datos falsos

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/ventas', fakeData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Devuelve la respuesta de la API
      return response.status(201).json(apiResponse.data);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
      return response.status(500).json({ message: 'Error al enviar datos a la API' });
    }
  }
}
