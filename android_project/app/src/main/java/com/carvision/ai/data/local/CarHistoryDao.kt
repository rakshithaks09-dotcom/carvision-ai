package com.carvision.ai.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object (DAO) for local vehicle analysis history.
 */
@Dao
interface CarHistoryDao {

    @Query("SELECT * FROM car_history ORDER BY timestamp DESC")
    fun getAllHistory(): Flow<List<CarHistoryEntity>>

    @Query("SELECT * FROM car_history WHERE id = :id LIMIT 1")
    suspend fun getHistoryById(id: Long): CarHistoryEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecord(record: CarHistoryEntity): Long

    @Delete
    suspend fun deleteRecord(record: CarHistoryEntity)

    @Query("DELETE FROM car_history WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM car_history")
    suspend fun clearAll()
}
