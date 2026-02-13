export const formatArabicDate = (date: string): string => {
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = arabicMonths[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const formatArabicTime = (date: string): string => {
  const dateObj = new Date(date);
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const formatArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-SA');
};

export const truncateArabicText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateArabicKeywords = (keywords: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(keywords) || /[a-zA-Z]/.test(keywords);
};

export const getDirectionClass = (direction: 'ltr' | 'rtl' = 'rtl'): string => {
  return direction === 'rtl' ? 'text-right' : 'text-left';
};