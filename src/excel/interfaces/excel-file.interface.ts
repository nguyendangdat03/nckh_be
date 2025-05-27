export interface ExcelFile {
  name: string;
  size: number;
  lastModified: Date;
  semester?: number;  // Kỳ học (1, 2, 3...)
  year?: number;      // Năm học
  description?: string; // Mô tả thêm về file
}
