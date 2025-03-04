import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DeviceCard = ({ device }) => {
  const isAvailable = device.status === 'available';
  
  // Status translation
  const statusText = isAvailable ? 'Có Sẵn' : 'Đang Mượn';
  const statusBadge = isAvailable ? 'badge-available' : 'badge-borrowed';
  const statusIcon = isAvailable ? 'check' : 'hand-holding';
  
  // Default image if none is provided
  const imageUrl = device.image ? device.image : '/placeholder-device.jpg';
  // console.log('Device image URL:', imageUrl, 'for device:', device.name);
  
  return (
    <Link href={`/devices/${device.id}`} className="card group hover:transform hover:scale-[1.01] transition-all duration-200">
      <div className="relative">
        <div className="relative h-48 w-full">
          <Image 
            src={imageUrl}
            alt={device.name}
            className="object-cover rounded-t-lg"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={true}
          />
          <div className="absolute top-2 right-2">
            <span className={`badge ${statusBadge} flex items-center`}>
              <FontAwesomeIcon icon={statusIcon} className="mr-1 h-3 w-3" />
              {statusText}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">{device.name}</h3>
        
        <div className="space-y-2 mb-4">
          {device.borrower && (
            <div className="flex items-start">
              <FontAwesomeIcon icon="user" className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Người mượn:</span> {device.borrower.name}
                </p>
              </div>
            </div>
          )}
          
          {device.warrantyEnd && (
            <div className="flex items-start">
              <FontAwesomeIcon icon="shield-alt" className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Bảo hành đến:</span> {device.warrantyEnd}
                </p>
              </div>
            </div>
          )}
          
          {device.locationImage && (
            <div className="flex items-start">
              <FontAwesomeIcon icon="map-marker-alt" className="h-4 w-4 text-indigo-500 mt-0.5 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Vị trí lưu trữ:</span> Có
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="btn-outline w-full text-sm">
            <FontAwesomeIcon icon="info-circle" className="mr-1" />
            Xem Chi Tiết
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DeviceCard;