import { AbstractService, Service } from '@asteroids'

import io from 'socket.io-client/dist/socket.io.js'

import { BehaviorSubject, Observable } from 'rxjs'

type SocketEmitEvents =
  | 'change-health'
  | 'change-scene'
  | 'connect-screen'
  | 'destroy'
  | 'disconnect'
  | 'game-over'
  | 'instantiate'
  | 'screen-amount'
  | 'update-slaves'

type SocketOnEvents =
  | 'change-health'
  | 'change-scene'
  | 'destroy'
  | 'game-over'
  | 'instantiate'
  | 'update-screen'

/**
 * Service responsible by connecting to the liquid galaxy socket
 * and emit/receive socket events.
 */
@Service()
export class SocketService extends AbstractService {
  /**
   * Property that defines the liquid galaxy socket.
   */
  public readonly socket = io(window.location.origin)

  /**
   * Emits some data to the given event.
   *
   * @param event The event name to emit to.
   * @param data The data to send to the socket listener.
   * @returns An observable that listens to the socket emittion response.
   */
  emit<T = Record<string, unknown>, R = Record<string, unknown>>(
    event: SocketEmitEvents,
    data?: T,
  ): Observable<R> {
    const subject = new BehaviorSubject<R>(void 0)
    this.socket.emit(event, data, (response: R) => {
      subject.next(response)
    })
    return subject.asObservable()
  }

  /**
   * Gets an observable that listens for the given event emittionq.
   *
   * @param event The event to listen to.
   * @returns An observable that listens to the event emittion.
   */
  on<T = Record<string, unknown>>(event: SocketOnEvents): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(event, (data: T) => {
        subscriber.next(data)
      })
    })
  }
}
