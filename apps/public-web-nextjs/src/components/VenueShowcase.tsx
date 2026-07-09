"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const API_BASE_URL = 'http://localhost:8080/api/v1';

export function VenueShowcase() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/venues`);
        if (!res.ok) throw new Error("Failed to fetch venues");
        const data = await res.json();
        setVenues(data || []);
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVenues = venues.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(venues.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    const element = document.getElementById("venue-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="venue-section" className="relative md:py-24 py-16">
      <div className="container relative">
        <div className="grid grid-cols-1 pb-8 text-center">
          <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">Venue Pertandingan</h3>
          <p className="text-slate-400 max-w-xl mx-auto">
            Jelajahi berbagai fasilitas olahraga kelas dunia yang akan menjadi arena unjuk gigi para pahlawan olahraga Jawa Barat.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center text-slate-500 my-8">
            <p>Belum ada data Venue.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
              {currentVenues.map((venue) => (
                <div key={venue.id} className="group relative block overflow-hidden rounded-md duration-500 shadow-md">
                  <div className="relative overflow-hidden duration-500 group-hover:scale-105 h-72">
                    {venue.image_url?.String ? (
                      <Image src={venue.image_url.String} width={400} height={300} className="w-full h-full object-cover" alt={venue.name} />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <i className="ri-map-pin-fill text-6xl text-slate-400"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 duration-500 transition-opacity"></div>
                  </div>
                  
                  {/* Techwind Masterpiece Card Style */}
                  <div className="absolute -bottom-64 group-hover:bottom-2 inset-s-2 inset-e-2 duration-500 bg-white dark:bg-slate-900 p-4 rounded shadow-sm dark:shadow-gray-800">
                    <Link href={`/cabor?venue=${venue.id}`} className="hover:text-primary text-lg duration-500 font-bold truncate block">
                      {venue.name}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1.5 line-clamp-3">
                      <p className="truncate" title={venue.address?.String}><i className="ri-map-pin-line text-primary me-1 text-sm align-middle"></i> {venue.address?.String || '-'}</p>
                      <p className="truncate" title="Kapasitas"><i className="ri-group-line text-primary me-1 text-sm align-middle"></i> Kapasitas: {venue.capacity?.Int32 || 0} penonton</p>
                      <p className="truncate" title={venue.readiness_status?.String}><i className="ri-medal-line text-primary me-1 text-sm align-middle"></i> Status: {venue.readiness_status?.String || '-'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <a href={venue.map_route_url?.String || '#'} target="_blank" className="text-primary text-sm font-semibold hover:underline">
                        <i className="ri-direction-line align-middle me-1"></i> Rute & Peta
                      </a>
                      <Link href={`/cabor?venue=${venue.id}`} className="text-slate-400 hover:text-primary text-sm">
                        Detail <i className="ri-arrow-right-line align-middle"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="grid md:grid-cols-12 grid-cols-1 mt-8">
                <div className="md:col-span-12 text-center">
                  <nav aria-label="Page navigation example">
                    <ul className="inline-flex items-center -space-x-px">
                      <li>
                        <button 
                          onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                          disabled={currentPage === 1}
                          className="size-[40px] inline-flex justify-center items-center text-slate-400 bg-white dark:bg-slate-900 rounded-s-lg hover:text-white border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-primary hover:bg-primary dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <i className="ri-arrow-left-s-line text-lg align-middle"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <li key={number}>
                          <button
                            onClick={() => paginate(number)}
                            className={`size-[40px] inline-flex justify-center items-center text-base font-semibold border border-gray-100 dark:border-gray-800 ${
                              currentPage === number 
                                ? "text-white bg-primary border-primary dark:border-primary" 
                                : "text-slate-400 bg-white dark:bg-slate-900 hover:text-white hover:bg-primary dark:hover:bg-primary hover:border-primary dark:hover:border-primary"
                            }`}
                          >
                            {number}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button 
                          onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                          disabled={currentPage === totalPages}
                          className="size-[40px] inline-flex justify-center items-center text-slate-400 bg-white dark:bg-slate-900 rounded-e-lg hover:text-white border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-primary hover:bg-primary dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <i className="ri-arrow-right-s-line text-lg align-middle"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
