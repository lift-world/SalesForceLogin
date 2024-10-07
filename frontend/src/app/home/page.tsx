'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios, { AxiosResponse } from 'axios';

interface UserProfile {
	name: string;
	email: string;
	address?: {
		country: string;
	};
	phone_number?: string;
	picture: string;
}

const getProfile = async (accessToken: string): Promise<UserProfile> => {
	try {
		const response: AxiosResponse<UserProfile> = await axios.get('/auth/getUser', {
			baseURL: process.env.API_BASE_URL, 
			params: { token: accessToken },
		});
		return response.data;
	} catch (error: any) {
		console.error('Error fetching user info:', error.response?.data || error.message);
		throw new Error('Failed to fetch user profile');
	}
};

const Home: React.FC = () => {
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState<boolean>(false);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleFetchUserProfile = async (token: string) => {
			setLoading(true);
			try {
				const userInfo = await getProfile(token);
				setProfile(userInfo);
			} catch (error: any) {
				setError(error.message);
			} finally {
				setLoading(false);
			}
		};

		const manageAccessToken = () => {
			let accessToken = searchParams.get('access_token');

			if (accessToken) {
				localStorage.setItem('token', accessToken);
				history.replaceState(null, '', window.location.pathname); // Remove URL params.  
			} else {
				accessToken = localStorage.getItem('token');
			}

			return accessToken;
		};

		const accessToken = manageAccessToken();
		if (accessToken) {
			handleFetchUserProfile(accessToken);
		} else {
			setError('Missing access token');
			window.location.href = '/login';
		}
	}, [searchParams]);

	const logout = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const response: AxiosResponse = await axios.get('/auth/logout', {
				baseURL: 'http://localhost:3000',
				params: { token },
			});
			if (response.data.success) {
				localStorage.removeItem('token');
				window.location.href = '/login';
			}
		} catch (error: any) {
			console.error('Error during logout:', error.response?.data || error.message);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="py-10 mb-10 text-5xl">
				{loading ? 'Loading...' : profile ? `Welcome, ${profile.name}` : 'Salesforce OAuth'}
			</h1>
			{/* Profile Picture */}
			{profile?.picture && (
				<div className="mb-6 rounded-full shadow-lg">
					<img
						src={profile.picture}
						alt={`${profile.name}'s profile picture`}
						width={150}
						height={150}
						className="rounded-full"
					/>
				</div>
			)}

			{error && <p className="text-red-500">{error}</p>}
			{!loading && profile && (
				<div className="text-center">
					<p>Name: {profile.name}</p>
					<p>Email: {profile.email}</p>
					{profile.address?.country && <p>Address: {profile.address.country}</p>}
					{profile.phone_number && <p>Phone: {profile.phone_number}</p>}
				</div>
			)}
			<button
				onClick={logout}
				className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold"
			>
				Logout
			</button>
		</div>
	);
};

export default Home;