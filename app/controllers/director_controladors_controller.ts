import Director from '#models/director'; // Asegúrate que el modelo se llame "Director"
import type { HttpContext } from '@adonisjs/core/http';
import axios from 'axios';
import { faker } from '@faker-js/faker'; // Importa Faker

export default class DirectorControladorsController {
  
  // Método para obtener todos los directores locales y consultar a la API externa
  public async index({ response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get('http://192.168.1.135:8000/api/personas', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Obtén los directores locales
      const directores = await Director.all();

      // Devuelve tanto los directores locales como los datos de la API externa
      return response.json({ local: directores, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para almacenar un nuevo director y enviar datos a la API externa
  public async store(ctx: HttpContext) {
    const { request, response } = ctx;
    const data = request.only(['nombre', 'nacionalidad']);
    const director = await Director.create(data);

    // Generar y enviar un director falso a la API externa
    await this.generateFakeDirector(ctx);

    return response.status(201).json(director);
  }

  // Método para mostrar un director específico y consultar a la API externa
  public async show({ params, response }: HttpContext) {
    try {
      // Consulta a la API externa
      const apiResponse = await axios.get(`http://192.168.1.135:8000/api/personas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Busca el director en la base de datos local
      const director = await Director.findOrFail(params.id);

      // Devuelve los datos locales y de la API externa
      return response.json({ local: director, external: apiResponse.data });
    } catch (error) {
      console.error('Error al obtener datos de la API externa:', error);
      return response.status(500).json({ message: 'Error al obtener datos de la API externa' });
    }
  }

  // Método para actualizar un director y enviar datos a la API externa
  public async update({ params, request, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    director.merge(request.only(['nombre', 'nacionalidad']));
    await director.save();

    try {
      // Enviar actualización a la API externa
      const apiResponse = await axios.put(`http://192.168.1.135:8000/api/personas/${params.id}`, request.only(['nombre', 'nacionalidad']));
      return response.json({
        director,
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

  // Método para eliminar un director y enviar datos a la API externa
  public async destroy({ params, response }: HttpContext) {
    const director = await Director.findOrFail(params.id);
    await director.delete();

    try {
      // Enviar la solicitud de eliminación a la API externa
      const apiResponse = await axios.delete(`http://192.168.1.135:8000/api/personas/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(204).json({
        message: 'Director eliminado exitosamente',
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

  // Método privado para generar datos falsos de un director
  private generateDirectorData() {
    return {
      nombres: faker.name.firstName(),
      apellidos: faker.name.lastName(),
      fecha_nacimiento: faker.date.past(),
    };
  }

  // Método para enviar un director falso a la API externa
  public async generateFakeDirector({ response }: HttpContext) {
    const directorData = this.generateDirectorData(); // Genera un director falso

    try {
      const apiResponse = await axios.post('http://192.168.1.135:8000/api/personas', directorData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.status(201).json(apiResponse.data); 
    } catch (error) {
      console.error('Error enviando el director a la API:', error);
      return response.status(500).json({ message: 'Error al enviar director a la API' });
    }
  }
}
