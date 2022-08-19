import {
  AbstractComponent,
  AbstractEntity,
  clamp,
  Component,
  Entity,
  IOnAwake,
  IOnDestroy,
  IOnLoop,
  isOverflowingX,
  Vector2,
} from '@asteroids'

import { LGService } from '../services/lg.service'

import { Transform } from './transform.component'

import { Howl } from 'howler'
import { BehaviorSubject } from 'rxjs'

/**
 * Component responsible for creating controlling audio sources.
 */
@Component({
  required: [Transform],
  services: [LGService],
})
export class AudioSource
  extends AbstractComponent
  implements IOnAwake, IOnDestroy, IOnLoop
{
  /**
   * Property that defines an object that represents the entity transform
   * component.
   */
  private transform: Transform

  /**
   * Property that defines the Liquid Galaxy service.
   */
  private lgService: LGService

  /**
   * Property that defines an object that represents the audio controller
   * object.
   */
  private howl: Howl

  /**
   * Property that defines whether the audio has already ended.
   */
  private _finished = new BehaviorSubject<boolean>(false)

  /**
   * Property that defines a boolean value responsible for saying if the
   * audio must be executed in the spatial mode.
   */
  spatial: boolean

  /**
   * Property that defines the audio source volume.
   */
  volume: number

  /**
   * Property that defines a string value that can be a path to the audio
   * clip or an url.
   */
  clip: string

  /**
   * Property that defines whether the audio will play on loop.
   */
  loop: boolean

  /**
   * Property that defines whether the audio is playing.
   */
  playing: boolean

  /**
   * Property that defines an observable that is triggered when the
   * '_finished' property changes its value.
   */
  get finished$() {
    return this._finished.asObservable()
  }

  onAwake() {
    this.lgService = this.getService(LGService)

    this.transform = this.getComponent(Transform)
  }

  onDestroy() {
    this.howl?.stop()
  }

  onLoop() {
    if (this.lgService.screen && this.lgService.screen.number !== 1) {
      return
    }

    if (this.howl && this.howl.rate() !== this.timeScale) {
      this.howl.rate(this.timeScale)
    }

    if (this.howl && this.spatial) {
      if (
        isOverflowingX(
          this.getContexts()[0].canvas.width,
          this.transform.position.x,
          this.transform.dimensions.width,
        )
      ) {
        this.howl.stereo(0)
      } else {
        this.howl.stereo(this.getStereoBias())
      }
    }
  }

  /**
   * Method that plays some sound related with this related entity.
   *
   * When the entity or this component is destroyed the audio stops.
   *
   * @param clip defines a string that represents the audio clip that will
   * be executed.
   * @param volume defines a number that represents the audio volume.
   */
  play(clip?: string, volume?: number) {
    if (this.lgService.screen && this.lgService.screen.number !== 1) {
      return
    }

    this.clip ??= clip

    this.howl = new Howl({
      src: this.clip,
      loop: this.loop,
      rate: this.timeScale,
      volume: volume || this.volume,
      onend: () => {
        this.playing = this.loop
        this._finished.next(true)
      },
    })

    this.playing = true
    this.howl.play()
  }

  /**
   * Method that plays some audio once, regardless the object is active or
   * destroyed.
   *
   * @param clip The path to the audio source.
   * @param position The entity current position.
   * @param volume The audio volume.
   */
  playOneShot(clip: string, position?: Vector2, volume = 1) {
    if (this.lgService.screen && this.lgService.screen.number !== 1) {
      return
    }

    @Entity()
    class DefaultEntity extends AbstractEntity {}

    const audioSource = this.instantiate({
      entity: DefaultEntity,
      components: [
        {
          class: Transform,
          use: {
            position: position || new Vector2(0, 0),
          },
        },
        {
          class: AudioSource,
          use: {
            clip,
            volume,
            spatial: !!position,
          },
        },
      ],
    })

    audioSource.getComponent(AudioSource).play()

    audioSource.getComponent(AudioSource).finished$.subscribe((value) => {
      if (value) {
        this.destroy(audioSource)
      }
    })
  }

  /**
   * Method that stops the current audio.
   */
  stop() {
    this.playing = false
    this.howl?.stop()
  }

  /**
   * Method that pauses the current audio.
   */
  pause() {
    this.playing = false
    this.howl?.pause()
  }

  /**
   * Method that calculates the audio source bias.
   *
   * @returns the calculated bias value.
   */
  private getStereoBias() {
    const width = this.getContexts()[0].canvas.width
    const bias =
      -(
        (Math.round(width / 2) - (width / 2 + this.transform.position.x)) /
        width
      ) * 2
    return clamp(bias, -1, 1)
  }
}
