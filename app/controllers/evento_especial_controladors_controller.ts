import SpecialEvent from '#models/evento_especial';
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ApiToken from '#models/token';

import env from '#start/env'

const baseUrl = env.get('baseUrl');
export default class EventoEspecialControladorsController {
  private async obtenerToken() {
    const tokenRecord = await ApiToken.query().orderBy('created_at', 'desc').first();
    return tokenRecord ? tokenRecord.token : null;
  }

  private async hacerSolicitudApi(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) {
    const token = await this.obtenerToken();

    if (!token) {
      throw new Error('Token no disponible para realizar la solicitud.');
    }

    try {
      const respuesta = await axios({
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error en la solicitud a la API externa:', error);
      throw new Error('Error al comunicarse con la API externa.');
    }
  }

  private generarDatosFalsosEvento() {
    return {
      fecha_hora: faker.date.past().toISOString().replace('T', ' ').split('.')[0],
      f_pago: faker.helpers.arrayElement(['efectivo', 'debito', 'credito']),
      id_empleado: 1,
    };
  }
  public async index({ response }: HttpContext) {
    try {
        const apiResponse = await this.hacerSolicitudApi('get', '/api/ventas');
        const eventosEspeciales = await SpecialEvent.all();

        return response.json({ local: eventosEspeciales, external: apiResponse });
    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
}

  public async store({ request, response }: HttpContext) {
    const data = request.only(['nombre', 'fecha']);
    const eventoEspecial = await SpecialEvent.create(data);
    const actorData = this.generarDatosFalsosEvento();

    try {
      const apiResponse = await this.hacerSolicitudApi('post', '/api/ventas/', actorData); 
      return response.status(201).json({ eventoEspecial, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const apiResponse = await this.hacerSolicitudApi('get', `/api/ventas/${params.id}`);
      const eventoEspecial = await SpecialEvent.findOrFail(params.id);
  
      return response.json({ local: eventoEspecial, external: apiResponse });
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    eventoEspecial.merge(request.only(['nombre', 'fecha']));
    await eventoEspecial.save();
    const fakeData = this.generarDatosFalsosEvento();

    try {
      const apiResponse = await this.hacerSolicitudApi('put', `/api/ventas/${params.id}`, fakeData);
      return response.json({ eventoEspecial, apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al enviar datos a la API', error: error.message });
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const eventoEspecial = await SpecialEvent.findOrFail(params.id);
    await eventoEspecial.delete();

    try {
      const apiResponse =  await this.hacerSolicitudApi('delete', `/api/ventas/${params.id}`);
      return response.status(204).json({ message: 'Evento especial eliminado exitosamente',apiResponse });
    } catch (error) {
      return response.status(500).json({ message: 'Error al eliminar datos en la API externa', error: error.message });
    }
  }

  public async sendFakeEventData() {
    const fakeData = this.generarDatosFalsosEvento();

    try {
      await this.hacerSolicitudApi('post', '/api/ventas', fakeData);
    } catch (error) {
      console.error('Error enviando datos a la API:', error);
    }
  }
}
