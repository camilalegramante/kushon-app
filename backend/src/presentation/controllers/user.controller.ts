import {
  Controller,
  Put,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { UpdateVolumeProgressDto } from '../../application/dtos/user/update-volume-progress.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Put('titles/:titleId/volumes')
  async updateVolumeProgress(
    @Request() req,
    @Param('titleId') titleId: string,
    @Body() updateData: UpdateVolumeProgressDto,
  ) {
    try {
      const result = await this.userService.updateUserVolumeProgress(
        req.user.id,
        titleId,
        updateData,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao atualizar progresso',
      };
    }
  }

  @Get('titles/:titleId/volumes')
  async getVolumeProgress(@Request() req, @Param('titleId') titleId: string) {
    try {
      const result = await this.userService.getUserVolumeProgress(
        req.user.id,
        titleId,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar progresso',
      };
    }
  }
}
