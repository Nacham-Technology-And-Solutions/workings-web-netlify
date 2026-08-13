import apiClient from './apiClient';
import { ApiResponse } from '@/utils/apiResponseHelper';

export interface UploadImageResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export const uploadService = {
  /**
   * Upload an image file to backend storage
   * @param file The image File object to upload
   * @param folder Subfolder name (e.g., 'logos', 'avatars')
   */
  uploadImage: async (file: File, folder: string = 'images'): Promise<ApiResponse<UploadImageResponse>> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<ApiResponse<UploadImageResponse>>(
      `/api/v1/upload/image?folder=${encodeURIComponent(folder)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
