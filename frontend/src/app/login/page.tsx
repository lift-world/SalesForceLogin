'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const SalesWithLoginPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);  

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="py-10 mb-10 text-5xl">
				{loading ? "We're logging you in..." : 'Account SalesWithLogin'}
			</h1>
			<Link href={'http://localhost:3000/auth/salesforce'} className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold">
				SalesForce With Login
			</Link>
		</div>
	);
}

export default SalesWithLoginPage;  