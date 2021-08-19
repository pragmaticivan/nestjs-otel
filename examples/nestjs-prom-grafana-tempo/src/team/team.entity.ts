import { ApiProperty } from '@nestjs/swagger';

export class Team {
  @ApiProperty({example: 1})
  id: number;

  @ApiProperty({example: 'Team 1'})
  name: string;

  @ApiProperty({example: 'active'})
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
