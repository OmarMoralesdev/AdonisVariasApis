import SpecialEvent from '#models/evento_especial';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token'; // Importa el modelo ApiToken

export default class EventoEspecialControladorsController {

  private async getToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async makeApiRequest(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data,
      });
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud a la API externa:', error);
      throw new Error('Error al comunicarse con la API externa.');
    }
  }

  private generateFakeEventData() {
    return {
      fecha_hora: faker.date.recent(),
      f_pago: faker.helpers.arrayElement(['efectivo', 'debito', 'credito']),
      id_empleado: faker.number.int({ min: 1, max: 5 }),
    };
  }

  public async index({ response }: HttpContext) {
    try {
      const eventosEspeciales = await SpecialEvent.all();
      return response.json({ local: eventosEspeciales });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'fecha']);
    const eventoEspecial = await SpecialEvent.create(data);

    // Generar y enviar datos falsos a la API externa
    await this.sendFakeEventData();

    return response.status(201).json(eventoEspecial);
  }

  public async show({ params, response }: HttpContext) {
    try {
      const [apiResponse, eventoEspecial] = await Promise.all([
        this.makeApiRequest('get', `http://192.168.1.135:8000/api/ventas/${params.id}`),
        SpecialEvent.findOrFail(params.id),
      ]);

      return response.json({ local: eventoEspecial, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    eventoEspecial.merge(request.only(['nombre', 'fecha']));
    await eventoEspecial.save();
    const fakeData = this.generateFakeEventData();

    try {
      const apiResponse = await this.makeApiRequest('put', `http://192.168.1.135:8000/api/ventas/${params.id}`, fakeData);
      return response.json({ eventoEspecial, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    await eventoEspecial.delete();

    try {
      await this.makeApiRequest('delete', `http://192.168.1.135:8000/api/ventas/${params.id}`);
      return response.status(204).json({ message: 'Evento especial eliminado exitosamente' });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeEventData() {
    const fakeData = this.generateFakeEventData(); // Genera datos falsos

    try {
      await this.makeApiRequest('post', 'http://192.168.1.135:8000/api/ventas', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
