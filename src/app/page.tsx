'use client';

import { useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const infoRef = useRef(null);
  const reviewsRef = useRef(null);
  const photosRef = useRef(null);

  const scrollToSection = (ref: any) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-gray-100 font-sans text-gray-800">
      
      {/* 헤더 (고정) */}
      <header className="fixed top-0 left-0 w-full z-30 bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Next.js Map UI
          </Link>
          <ul className="flex space-x-6">
            <li>
              <button onClick={() => scrollToSection(infoRef)} className="hover:text-indigo-600 transition-colors">
                정보
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection(reviewsRef)} className="hover:text-indigo-600 transition-colors">
                리뷰
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection(photosRef)} className="hover:text-indigo-600 transition-colors">
                사진
              </button>
            </li>
          </ul>
        </nav>
      </header>
      
      {/* 맵처럼 고정될 섹션 */}
      <section 
        className="fixed top-0 left-0 w-full h-screen z-0 flex items-center justify-center bg-blue-500 text-white"
      >
        <div className="text-center">
          <h2 className="text-4xl font-bold">메인 화면 (고정됨)</h2>
          <p className="mt-4 text-lg">아래 창을 위로 스크롤해 보세요!</p>
        </div>
      </section>

      {/* 스크롤 가능한 콘텐츠를 담을 컨테이너 */}
      <div className="relative z-10 w-full pt-[85vh]">
        
        {/* 아래에서 올라오는 창 */}
        <div className="bg-white rounded-t-3xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                아래에서 올라오는 창
            </h3>
            
            {/* 스크롤 콘텐츠 */}
            <div className="space-y-8">
                <div ref={infoRef} className="min-h-[50vh] bg-gray-100 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold mb-2">상세 정보</h4>
                    <p>이곳에 매장 정보, 영업 시간, 연락처 등을 넣을 수 있습니다.</p>
                </div>
                <div ref={reviewsRef} className="min-h-[50vh] bg-gray-100 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold mb-2">리뷰</h4>
                    <p>사용자 리뷰 목록을 보여주는 섹션입니다.</p>
                </div>
                <div ref={photosRef} className="min-h-[50vh] bg-gray-100 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold mb-2">사진</h4>
                    <p>갤러리나 관련 사진을 보여주는 섹션입니다.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}