import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdvisorsService } from "./advisors.service";
import { Advisor } from "../entities/advisor.entity";
import { CreateAdvisorDto } from "./dto/create-advisor.dto";

@ApiTags("advisors")
@Controller("advisors")
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách cố vấn" })
  @ApiResponse({ status: 200, description: "Thành công", type: [Advisor] })
  findAll(): Promise<Advisor[]> {
    return this.advisorsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin một cố vấn" })
  @ApiResponse({ status: 200, description: "Thành công", type: Advisor })
  findOne(@Param("id") id: number): Promise<Advisor> {
    return this.advisorsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Tạo cố vấn mới" })
  @ApiResponse({ status: 201, description: "Tạo thành công", type: Advisor })
  create(@Body() createAdvisorDto: CreateAdvisorDto): Promise<Advisor> {
    return this.advisorsService.create(createAdvisorDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật thông tin cố vấn" })
  @ApiResponse({
    status: 200,
    description: "Cập nhật thành công",
    type: Advisor,
  })
  update(
    @Param("id") id: number,
    @Body() updateAdvisorDto: Partial<CreateAdvisorDto>
  ): Promise<Advisor> {
    return this.advisorsService.update(id, updateAdvisorDto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Xóa cố vấn" })
  @ApiResponse({ status: 204, description: "Xóa thành công" })
  remove(@Param("id") id: number): Promise<void> {
    return this.advisorsService.remove(id);
  }
}
