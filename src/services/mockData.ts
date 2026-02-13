import { SearchResult } from '../types/business';

export const mockBusinessData: SearchResult[] = [
  {
    id: 'mock-1',
    name: 'مطعم البحر الأبيض',
    address: 'شارع الملك فهد، الرياض 12345، المملكة العربية السعودية',
    phone: '+966112345678',
    website: 'https://example.com',
    rating: 4.5,
    reviewCount: 126,
    category: 'مطعم',
    coordinates: { lat: 24.7136, lng: 46.6753 },
    hours: 'مفتوح 24 ساعة',
    priceLevel: 'متوسط'
  },
  {
    id: 'mock-2',
    name: 'صيدلية النور',
    address: 'طريق العليا، الرياض 11564، المملكة العربية السعودية',
    phone: '+966112345679',
    rating: 4.2,
    reviewCount: 89,
    category: 'صيدلية',
    coordinates: { lat: 24.7247, lng: 46.6633 },
    hours: 'من 8:00 ص إلى 12:00 م',
    priceLevel: ''
  },
  {
    id: 'mock-3',
    name: 'بنك الأهلي',
    address: 'شارع التحلية، جدة 21455، المملكة العربية السعودية',
    phone: '+966126789012',
    website: 'https://alahli.com',
    rating: 3.8,
    reviewCount: 234,
    category: 'بنك',
    coordinates: { lat: 21.5811, lng: 39.1380 },
    hours: 'الأحد - الخميس: 8:00 ص - 3:00 م',
    priceLevel: ''
  },
  {
    id: 'mock-4',
    name: 'مركز الحاسوب',
    address: 'شارع الأمير محمد بن عبدالعزيز، الدمام 32214، المملكة العربية السعودية',
    phone: '+966138765432',
    rating: 4.6,
    reviewCount: 67,
    category: 'إلكترونيات',
    coordinates: { lat: 26.4207, lng: 50.0888 },
    hours: 'من 9:00 ص إلى 10:00 م',
    priceLevel: 'مكلف'
  },
  {
    id: 'mock-5',
    name: 'مكتبة جرير',
    address: 'طريق الملك عبدالله، الرياض 12311، المملكة العربية السعودية',
    phone: '+966114567890',
    website: 'https://jarir.com',
    rating: 4.3,
    reviewCount: 156,
    category: 'مكتبة',
    coordinates: { lat: 24.6877, lng: 46.7219 },
    hours: 'من 9:00 ص إلى 11:00 م',
    priceLevel: 'متوسط'
  }
];

export const businessCategories = [
  { value: 'all', label: 'جميع الفئات' },
  { value: 'restaurant', label: 'مطاعم' },
  { value: 'pharmacy', label: 'صيدليات' },
  { value: 'bank', label: 'بنوك' },
  { value: 'hospital', label: 'مستشفيات' },
  { value: 'school', label: 'مدارس' },
  { value: 'shopping_mall', label: 'مراكز تسوق' },
  { value: 'gas_station', label: 'محطات وقود' },
  { value: 'electronics_store', label: 'متاجر إلكترونيات' },
  { value: 'book_store', label: 'مكتبات' },
  { value: 'clothing_store', label: 'متاجر ملابس' },
  { value: 'grocery_store', label: 'متاجر بقالة' }
];