import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Team } from './team.entity';
import { TeamService } from './team.service';

@Controller('teams')
@ApiTags('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('')
  list(): Promise<Team[]> {
    return this.teamService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Team })
  findOne(@Param('id') id) {
    return this.teamService.findOne(id);
  }
}
