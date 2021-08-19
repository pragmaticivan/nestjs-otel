import { Injectable } from '@nestjs/common';
import { OtelMethodCounter, Span, TraceService } from 'nestjs-otel';
import { Team } from './team.entity';

const team = new Team();
team.id = 1;
team.name = 'my team';
team.status = 'active';
team.createdAt = new Date();
team.updatedAt = new Date();

@Injectable()
export class TeamService {
  constructor(private readonly traceService: TraceService) {}

  @Span('findOne section')
  @OtelMethodCounter()
  async findOne(id: number): Promise<Team> {
    const currentSpan = this.traceService.getSpan();
    currentSpan.addEvent('some event');
    currentSpan.end();
    return { ...team, ...{ id } };
  }

  @Span('findAll section')
  @OtelMethodCounter()
  async findAll(): Promise<Team[]> {
    return [team];
  }
}
