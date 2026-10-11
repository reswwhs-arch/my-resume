// src/data/projectsData.js

export const PROJECTS = {
  blender: [
    {
      id: 'tv',
      title: 'Телевизор',
      description: 'Простой проект по моделированию телевизора. Базовая работа с полигонами, создаём простую геометрию и прорабатываем детали.',
      type: 'image',
      media: '/portfolio/tv.png',
      projectType: 'Обучающий проект',
      timeSpent: '6 минут',
      completion: 80
    },
    {
      id: 'motion-tracking',
      title: 'Текст в видео (Motion Tracking)',
      description: 'Работа с motion tracking в Blender. Размещение текста в 3D пространстве так, чтобы он корректно взаимодействовал с объектами и не проходил сквозь них.',
      type: 'video',
      media: '/projects/blender/420001-0833.mp4',
      projectType: 'Учебный проект',
      timeSpent: 'Не указано',
      completion: 30
    },
    {
      id: 'house',
      title: 'Дом',
      description: 'Архитектурное моделирование дома. Работа с пропорциями и структурой здания.',
      type: 'image',
      media: '/portfolio/house.png',
      projectType: 'Учебный проект',
      timeSpent: 'Не указано',
      completion: 50
    },
    {
      id: 'spaceship',
      title: 'Космический корабль',
      description: 'Наработка для работы с радиаторами и деталями. Эксперимент с более сложной геометрией и проработкой технических элементов.',
      type: 'image',
      media: '/portfolio/spaceship.png',
      projectType: 'Учебный проект',
      timeSpent: 'Не указано',
      completion: 98
    }
  ],
  video: [
    {
      id: 'post-montage',
      title: 'Пост-видеомонтаж',
      description: 'Пример пост-видеомонтажа. Нарезка, базовые переходы и экспорт материала.',
      type: 'video',
      media: '/projects/video/video_2026-10-11_07-10-29.mp4',
      projectType: 'Рабочий проект',
      timeSpent: 'Не указано',
      completion: 30
    }
  ]
}
