import { Type } from './type.interface'

export interface IComponentOptions {
  services?: Type<any>[]
  required?: Type<any>[]
  order?: number
}
