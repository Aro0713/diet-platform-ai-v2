import React from 'react'
import Head from 'next/head'
import LoginDoctorForm from '../components/LoginDoctorForm'

export default function DoctorPage() {
  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <Head>
        <title>Logowanie – Lekarz / Dietetyk</title>
      </Head>

      <div className='max-w-2xl mx-auto'>
        <LoginDoctorForm />
      </div>
    </div>
  )
}
