import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { UserJwtGuard } from '../user-auth/user-jwt.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { CreateOrderDto } from './dtos/create-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(UserJwtGuard)
  @ApiOperation({ summary: 'Plasează o comandă nouă (client B2B)' })
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const user = req.user;
    return this.ordersService.create({
      userId: user.sub,
      userEmail: user.email,
      userName: user.name,
      items: dto.items,
      deliveryAddress: dto.deliveryAddress,
    });
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(UserJwtGuard)
  @ApiOperation({ summary: 'Istoric comenzi proprii (client B2B)' })
  async getMyOrders(@Req() req: any) {
    return this.ordersService.findByUser(req.user.sub);
  }

  @Get(':id/pdf')
  @ApiBearerAuth()
  @UseGuards(UserJwtGuard)
  @ApiOperation({ summary: 'Descarcă factura PDF pentru o comandă proprie (client B2B)' })
  async getPdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const order = await this.ordersService.findById(id);
    if (order.userId !== req.user.sub) {
      throw new ForbiddenException('Nu aveți acces la această comandă.');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${id.slice(0, 8)}.pdf`);
    this.pdfService.generateOrderPdf(order, res);
  }

  @Get(':id/pdf/admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Descarcă factura PDF (admin)' })
  async getPdfAdmin(@Param('id') id: string, @Res() res: Response) {
    const order = await this.ordersService.findById(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${id.slice(0, 8)}.pdf`);
    this.pdfService.generateOrderPdf(order, res);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Toate comenzile (admin)' })
  async findAll() {
    return this.ordersService.findAll();
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Actualizează status comandă (admin)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.ordersService.updateStatus(id, status);
  }
}
