/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import SerieControlador from '#controllers/serie_controladors_controller'
import ActorControlador from '#controllers/actor_controladors_controller'
import PersonajeControlador from '#controllers/personaje_controladors_controller'
import TemporadaControlador from '#controllers/temporada_controladors_controller'
import EpisodioControlador from '#controllers/episodio_controladors_controller'
import EscenaMemorableControlador from '#controllers/escena_memorable_controladors_controller'
import PremioControlador from '#controllers/premio_controladors_controller'
import EventoEspecialControlador from '#controllers/evento_especial_controladors_controller'
import CategoríaControlador from '#controllers/categoria_controladors_controller'
/*import CategoríaSerieControlador from '#controllers/categoria_serie_controlador'*/
import DirectorControlador from '#controllers/director_controladors_controller'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
router.get('/directores', [DirectorControlador, 'index']).use(middleware.auth())
router.post('/directores', [DirectorControlador, 'store']).use(middleware.auth())
router.get('/directores/:id', [DirectorControlador, 'show']).use(middleware.auth())
router.put('/directores/:id', [DirectorControlador, 'update']).use(middleware.auth())
router.delete('/directores/:id', [DirectorControlador, 'destroy']).use(middleware.auth())

router.get('/series', [SerieControlador, 'index']).use(middleware.auth())
router.post('/series', [SerieControlador, 'store']).use(middleware.auth())
router.get('/series/:id', [SerieControlador, 'show']).use(middleware.auth())
router.put('/series/:id', [SerieControlador, 'update']).use(middleware.auth())
router.delete('/series/:id', [SerieControlador, 'destroy']).use(middleware.auth())

router.get('/actores', [ActorControlador, 'index']).use(middleware.auth())
router.post('/actores', [ActorControlador, 'store']).use(middleware.auth())
router.get('/actores/:id', [ActorControlador, 'show']).use(middleware.auth())
router.put('/actores/:id', [ActorControlador, 'update']).use(middleware.auth())
router.delete('/actores/:id', [ActorControlador, 'destroy']).use(middleware.auth())

router.get('/personajes', [PersonajeControlador, 'index']).use(middleware.auth())
router.post('/personajes', [PersonajeControlador, 'store']).use(middleware.auth())
router.get('/personajes/:id', [PersonajeControlador, 'show']).use(middleware.auth())
router.put('/personajes/:id', [PersonajeControlador, 'update']).use(middleware.auth())
router.delete('/personajes/:id', [PersonajeControlador, 'destroy']).use(middleware.auth())

router.get('/temporadas', [TemporadaControlador, 'index']).use(middleware.auth())
router.post('/temporadas', [TemporadaControlador, 'store']).use(middleware.auth())
router.get('/temporadas/:id', [TemporadaControlador, 'show']).use(middleware.auth())
router.put('/temporadas/:id', [TemporadaControlador, 'update']).use(middleware.auth())
router.delete('/temporadas/:id', [TemporadaControlador, 'destroy']).use(middleware.auth())

router.get('/episodios', [EpisodioControlador, 'index']).use(middleware.auth())
router.post('/episodios', [EpisodioControlador, 'store']).use(middleware.auth())
router.get('/episodios/:id', [EpisodioControlador, 'show']).use(middleware.auth())
router.put('/episodios/:id', [EpisodioControlador, 'update']).use(middleware.auth())
router.delete('/episodios/:id', [EpisodioControlador, 'destroy']).use(middleware.auth())

router.get('/escenas-memorables', [EscenaMemorableControlador, 'index']).use(middleware.auth())
router.post('/escenas-memorables', [EscenaMemorableControlador, 'store']).use(middleware.auth())
router.get('/escenas-memorables/:id', [EscenaMemorableControlador, 'show']).use(middleware.auth())
router.put('/escenas-memorables/:id', [EscenaMemorableControlador, 'update']).use(middleware.auth())
router
  .delete('/escenas-memorables/:id', [EscenaMemorableControlador, 'destroy'])
  .use(middleware.auth())

router.get('/premios', [PremioControlador, 'index']).use(middleware.auth())
router.post('/premios', [PremioControlador, 'store']).use(middleware.auth())
router.get('/premios/:id', [PremioControlador, 'show']).use(middleware.auth())
router.put('/premios/:id', [PremioControlador, 'update']).use(middleware.auth())
router.delete('/premios/:id', [PremioControlador, 'destroy']).use(middleware.auth())

router.get('/eventos-especiales', [EventoEspecialControlador, 'index']).use(middleware.auth())
router.post('/eventos-especiales', [EventoEspecialControlador, 'store']).use(middleware.auth())
router.get('/eventos-especiales/:id', [EventoEspecialControlador, 'show']).use(middleware.auth())
router.put('/eventos-especiales/:id', [EventoEspecialControlador, 'update']).use(middleware.auth())
router
  .delete('/eventos-especiales/:id', [EventoEspecialControlador, 'destroy'])
  .use(middleware.auth())

router.get('/categorias', [CategoríaControlador, 'index']).use(middleware.auth())
router.post('/categorias', [CategoríaControlador, 'store']).use(middleware.auth())
router.get('/categorias/:id', [CategoríaControlador, 'show']).use(middleware.auth())
router.put('/categorias/:id', [CategoríaControlador, 'update']).use(middleware.auth())
router.delete('/categorias/:id', [CategoríaControlador, 'destroy']).use(middleware.auth())

/*
  router.get('/categorias-series', [CategoríaSerieControlador, 'index']);
  router.post('/categorias-series', [CategoríaSerieControlador, 'store']);
  router.get('/categorias-series/:id', [CategoríaSerieControlador, 'show']);
  router.put('/categorias-series/:id', [CategoríaSerieControlador, 'update']);
  router.delete('/categorias-series/:id', [CategoríaSerieControlador, 'destroy']);
  */

const AuthController = () => import('#controllers/auth_controller')
router.post('registrar', [AuthController, 'registrar'])
router.post('login', [AuthController, 'login3'])
router.post('registrarlocal', [AuthController, 'registrarJWT'])
router.post('loginlocal', [AuthController, 'loginJWT'])


router
  .get('me', async ({ auth, response }) => {
    try {
      const user = auth.getUserOrFail()
      return response.ok(user)
    } catch (error) {
      return response.unauthorized({ error: 'User not found' })
    }
  })
  .use(middleware.auth())
