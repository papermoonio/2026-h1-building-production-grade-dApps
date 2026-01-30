#![cfg_attr(not(feature = "std"), no_std)]

/// A pallet for managing a simple token system with issuance and transfers.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://docs.substrate.io/reference/frame-pallets/>
pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
	use frame_support::pallet_prelude::*;
	use frame_system::pallet_prelude::*;
	use sp_runtime::traits::{AtLeast32BitUnsigned, Member};

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	/// Configure the pallet by specifying the parameters and types on which it depends.
	#[pallet::config]
	pub trait Config: frame_system::Config {
		/// Because this pallet emits events, it depends on the runtime's definition of an event.
		type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
		
		/// The units in which we record balances.
		type Balance: Member + Parameter + AtLeast32BitUnsigned + Default + Copy;
		
		/// The arithmetic type of asset identifier.
		type AssetId: Member + Parameter + AtLeast32BitUnsigned + Default + Copy;
	}

	// The pallet's runtime storage items.
	// https://docs.substrate.io/main-docs/build/runtime-storage/
	
	/// Stores the total supply of each asset.
	#[pallet::storage]
	#[pallet::getter(fn total_supply)]
	pub type TotalSupply<T: Config> = StorageMap<_, Blake2_128Concat, T::AssetId, T::Balance, ValueQuery>;
	
	/// Stores the balance of each account for each asset.
	#[pallet::storage]
	#[pallet::getter(fn balance_of)]
	pub type Balances<T: Config> = StorageDoubleMap<
		_,
		Blake2_128Concat,
		T::AssetId,
		Blake2_128Concat,
		T::AccountId,
		T::Balance,
		ValueQuery,
	>;
	
	/// Stores the next asset ID to be issued.
	#[pallet::storage]
	#[pallet::getter(fn next_asset_id)]
	pub type NextAssetId<T: Config> = StorageValue<_, T::AssetId, ValueQuery>;

	// Pallets use events to inform users when important changes are made.
	// https://docs.substrate.io/main-docs/build/events-errors/
	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		/// New asset created. [asset_id, creator, initial_supply]
		AssetCreated {
			asset_id: T::AssetId,
			creator: T::AccountId,
			initial_supply: T::Balance,
		},
		
		/// Tokens transferred. [asset_id, from, to, amount]
		Transferred {
			asset_id: T::AssetId,
			from: T::AccountId,
			to: T::AccountId,
			amount: T::Balance,
		},
		
		/// Additional tokens issued. [asset_id, issuer, amount]
		TokensIssued {
			asset_id: T::AssetId,
			issuer: T::AccountId,
			amount: T::Balance,
		},
	}

	// Errors inform users that something went wrong.
	#[pallet::error]
	pub enum Error<T> {
		/// Not enough balance to perform the operation.
		InsufficientBalance,
		/// Arithmetic overflow occurred.
		Overflow,
		/// Asset does not exist.
		AssetNotFound,
		/// Cannot transfer to self.
		TransferToSelf,
	}

	// Dispatchable functions allows users to interact with the pallet and invoke state changes.
	// These functions materialize as "extrinsics", which are often compared to transactions.
	// Dispatchable functions must be annotated with a weight and must return a DispatchResult.
	#[pallet::call]
	impl<T: Config> Pallet<T> {
		/// Create a new asset with initial supply.
		#[pallet::weight(10_000 + T::DbWeight::get().writes(3).ref_time())]
		pub fn create_asset(origin: OriginFor<T>, initial_supply: T::Balance) -> DispatchResult {
			let who = ensure_signed(origin)?;
			
			let asset_id = Self::next_asset_id();
			NextAssetId::<T>::mutate(|id| *id += T::AssetId::from(1u32));
			
			TotalSupply::<T>::insert(asset_id, initial_supply);
			Balances::<T>::insert(asset_id, &who, initial_supply);
			
			Self::deposit_event(Event::AssetCreated {
				asset_id,
				creator: who.clone(),
				initial_supply,
			});
			
			Ok(())
		}
		
		/// Transfer tokens to another account.
		#[pallet::weight(10_000 + T::DbWeight::get().reads_writes(2,2).ref_time())]
		pub fn transfer(
			origin: OriginFor<T>,
			asset_id: T::AssetId,
			to: T::AccountId,
			amount: T::Balance,
		) -> DispatchResult {
			let from = ensure_signed(origin)?;
			
			ensure!(from != to, Error::<T>::TransferToSelf);
			
			let from_balance = Self::balance_of(asset_id, &from);
			ensure!(from_balance >= amount, Error::<T>::InsufficientBalance);
			
			let new_from_balance = from_balance
				.checked_sub(&amount)
				.ok_or(Error::<T>::Overflow)?;
			let new_to_balance = Self::balance_of(asset_id, &to)
				.checked_add(&amount)
				.ok_or(Error::<T>::Overflow)?;
			
			Balances::<T>::insert(asset_id, &from, new_from_balance);
			Balances::<T>::insert(asset_id, &to, new_to_balance);
			
			Self::deposit_event(Event::Transferred {
				asset_id,
				from,
				to,
				amount,
			});
			
			Ok(())
		}
		
		/// Issue additional tokens for an existing asset.
		#[pallet::weight(10_000 + T::DbWeight::get().reads_writes(2,2).ref_time())]
		pub fn issue_tokens(
			origin: OriginFor<T>,
			asset_id: T::AssetId,
			amount: T::Balance,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;
			
			// Check if asset exists by checking if there's a balance record
			ensure!(TotalSupply::<T>::contains_key(asset_id), Error::<T>::AssetNotFound);
			
			let new_total_supply = Self::total_supply(asset_id)
				.checked_add(&amount)
				.ok_or(Error::<T>::Overflow)?;
			let new_balance = Self::balance_of(asset_id, &who)
				.checked_add(&amount)
				.ok_or(Error::<T>::Overflow)?;
			
			TotalSupply::<T>::insert(asset_id, new_total_supply);
			Balances::<T>::insert(asset_id, &who, new_balance);
			
			Self::deposit_event(Event::TokensIssued {
				asset_id,
				issuer: who,
				amount,
			});
			
			Ok(())
		}
		
		/// Get balance of an account for a specific asset.
		#[pallet::weight(10_000 + T::DbWeight::get().reads(1).ref_time())]
		pub fn get_balance(
			origin: OriginFor<T>,
			asset_id: T::AssetId,
			account: T::AccountId,
		) -> DispatchResult {
			ensure_signed(origin)?;
			
			let balance = Self::balance_of(asset_id, &account);
			let total_supply = Self::total_supply(asset_id);
			
			// In a real implementation, you would return this data
			// For now, we just emit an event with the information
			frame_support::print(format!(
				"Balance: {:?}, Total Supply: {:?}", 
				balance, 
				total_supply
			));
			
			Ok(())
		}
	}
}