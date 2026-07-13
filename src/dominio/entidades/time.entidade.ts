export interface PropsTime {
  id: number;
  name: string;
  description: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface TimePublico {
  id: number;
  name: string;
  description: string | null;
}

export class Time {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  constructor(props: PropsTime) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  paraResposta(): TimePublico {
    return { id: this.id, name: this.name, description: this.description };
  }
}
