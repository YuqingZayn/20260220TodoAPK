import { IsString, IsBoolean, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  priority?: number = 3;
}

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  priority?: number;
}
